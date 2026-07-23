const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
import dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'testing'}` });

import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { join } from 'path';
import { MAPPINGS, Mapping } from '../world/notion/mapping';

// notion-diff: DRY-RUN comparison of the Notion design databases against the
// world-data CSVs. READ-ONLY — it never writes a CSV and never deploys. It is
// the review gate for the Notion->CSV->deploy flow: a human reads this diff,
// then selectively applies + deploys index-scoped. See deployment/world/notion/
// README.md and the deploy runbook's "World data" doctrine.

const argv = yargs(hideBin(process.argv))
  .usage('Usage: NODE_ENV=<env> ts-node deployment/commands/notionSync.ts [--table <label>]')
  .option('table', { type: 'string', describe: 'only diff mappings whose label contains this substring' })
  .parse();

const NOTION = 'https://api.notion.com/v1';
const VERSION = '2022-06-28';
const DATA_DIR = join(__dirname, '../world/data');

// the env value may carry a trailing "# comment" — strip to the bare token
const TOKEN = (process.env.NOTION_PAT || '').split('#')[0].trim().replace(/^["']|["']$/g, '');

// notion caps ~3 req/s; a small gap keeps well under the limit
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── terminal formatting (house style, cf. game2 scripts/balance/core/format.ts) ──
// colors gate on a REAL tty (piping the diff to a file must stay clean); use
// FORCE_COLOR=1 to override, NO_COLOR to suppress
const FMT_TTY =
  process.env.NO_COLOR == null &&
  (process.env.FORCE_COLOR === '1' || process.stdout.isTTY === true);
const ANSI = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', blue: '\x1b[34m', cyan: '\x1b[36m', gray: '\x1b[90m',
  violet: '\x1b[38;5;141m', violetDim: '\x1b[38;5;97m',
} as const;
const c = (code: keyof typeof ANSI, s: string) => (FMT_TTY ? `${ANSI[code]}${s}${ANSI.reset}` : s);
const visW = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, '').length;
const pad = (s: string, w: number) => (visW(s) < w ? s + ' '.repeat(w - visW(s)) : s);
const trunc = (s: string, w: number) => (s.length <= w ? s : s.slice(0, w - 1) + '…');
const ok = () => (FMT_TTY ? c('green', '✓') : 'OK');
const bad = () => (FMT_TTY ? c('red', '✗') : '!!');
const RULE_W = 74;
function tableRule(label: string, sub: string) {
  const head = ` ${c('bold', label)} `;
  const dashes = c('violetDim', '━'.repeat(Math.max(0, RULE_W - visW(head) - visW(sub) - 3)));
  console.log('\n' + c('violet', '━━') + head + dashes + ' ' + c('dim', sub));
}
function titleCard(nTables: number) {
  const w = RULE_W;
  const line = (s: string) => c('violet', '│') + ' ' + pad(s, w - 3) + c('violet', '│');
  console.log(c('violet', '╭─ ') + c('bold', 'notion ⇄ csv diff') + c('violet', ' ' + '─'.repeat(w - 22) + '╮'));
  console.log(line(c('dim', `DRY-RUN · read-only · ${nTables} table${nTables === 1 ? '' : 's'} · nothing is written or deployed`)));
  console.log(line(c('dim', 'chain is canon · notion is design intent · review before applying')));
  console.log(c('violet', '╰' + '─'.repeat(w - 1) + '╯'));
}

async function notion(path: string, body?: any): Promise<any> {
  for (let attempt = 0; ; attempt++) {
    let res: Response;
    try {
      res = await fetch(`${NOTION}${path}`, {
        method: body ? 'POST' : 'GET',
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Notion-Version': VERSION,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(20_000), // never hang on a stalled/hung response
      });
    } catch (e: any) {
      if (attempt < 4) { await sleep(1000 * (attempt + 1)); continue; } // timeout / network — retry
      throw new Error(`notion ${path}: ${e.name === 'TimeoutError' ? 'request timed out' : e.message}`);
    }
    if (res.status === 429 && attempt < 5) {
      await sleep(1000 * (attempt + 1));
      continue;
    }
    const json = await res.json();
    if (!res.ok) throw new Error(`notion ${path}: ${json.message || res.status}`);
    return json;
  }
}

// pinned-id path: retrieve the db and verify its live title still matches the
// mapping — a retitled/swapped db fails loudly instead of silently mis-diffing
async function verifyDbId(id: string, name: string): Promise<string> {
  const db = await notion(`/databases/${id}`);
  const title = (db.title || []).map((t: any) => t.plain_text).join('').trim();
  if (title !== name) throw new Error(`pinned db ${id} is titled "${title}", expected "${name}" — fix the mapping`);
  return id;
}

async function resolveDbId(name: string): Promise<string> {
  const matches: string[] = [];
  let cursor: string | undefined;
  do {
    const res = await notion('/search', {
      query: name,
      filter: { property: 'object', value: 'database' },
      ...(cursor ? { start_cursor: cursor } : {}),
    });
    for (const r of res.results)
      // dedupe by id — notion search can return the same db on multiple pages
      if (r.title?.map((t: any) => t.plain_text).join('').trim() === name && !matches.includes(r.id))
        matches.push(r.id);
    cursor = res.has_more ? res.next_cursor : undefined;
    if (cursor) await sleep(300);
  } while (cursor);
  if (!matches.length) throw new Error(`database "${name}" not visible to the integration (share it, or fix the name)`);
  if (matches.length > 1)
    console.log(c('yellow', `      ! ${matches.length} databases titled "${name}" — using the first; disambiguate the mapping`));
  return matches[0];
}

// pull every row of a database (paginated). Cached per run: several mappings can
// slice one db (Droptables fans out by Type into three CSVs) — fetch it once.
const queryCache = new Map<string, any[]>();
async function queryAll(dbId: string): Promise<any[]> {
  const hit = queryCache.get(dbId);
  if (hit) return hit;
  const rows: any[] = [];
  let cursor: string | undefined;
  do {
    const res = await notion(`/databases/${dbId}/query`, cursor ? { start_cursor: cursor } : {});
    rows.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
    if (cursor) await sleep(350);
  } while (cursor);
  queryCache.set(dbId, rows);
  return rows;
}

// extract a comparable string from a Notion property; null = complex type we
// deliberately don't diff yet (relation/files/people). deploy-relevant signal
// lives in the simple types, plus formula + number/simple-array rollups.
function propValue(p: any): string | null {
  if (!p) return '';
  switch (p.type) {
    case 'title':
    case 'rich_text':
      return (p[p.type] || []).map((t: any) => t.plain_text).join('').trim();
    case 'number':
      return p.number === null || p.number === undefined ? '' : String(p.number);
    case 'select':
      return p.select?.name ?? '';
    case 'status':
      return p.status?.name ?? '';
    case 'multi_select':
      return (p.multi_select || []).map((s: any) => s.name).sort().join(',');
    case 'checkbox':
      return p.checkbox ? 'true' : 'false';
    case 'url':
    case 'email':
    case 'phone_number':
      return p[p.type] ?? '';
    case 'date':
      return p.date?.start ?? '';
    case 'formula': {
      const f = p.formula || {};
      if (f.type === 'number') return f.number === null || f.number === undefined ? '' : String(f.number);
      if (f.type === 'string') return f.string ?? '';
      if (f.type === 'boolean') return f.boolean ? 'true' : 'false';
      if (f.type === 'date') return f.date?.start ?? '';
      return null;
    }
    case 'rollup': {
      const rl = p.rollup || {};
      if (rl.type === 'number') return rl.number === null || rl.number === undefined ? '' : String(rl.number);
      if (rl.type === 'array') {
        const vals = (rl.array || []).map((el: any) => propValue(el)); // elements share the property shape
        if (vals.some((v: string | null) => v === null)) return null; // a complex element (e.g. relation) — don't diff
        return vals.map((v: string) => v.trim()).filter(Boolean).sort().join(',');
      }
      return null;
    }
    default:
      return null; // relation, files, people, ...
  }
}

// normalize a value: whitespace-tolerant, boolean-canonical, numeric-equal.
// NB: no comma-sort here — that only applies to genuine multi-value columns
// (normList), so prose/rich_text or order-significant lists compare verbatim.
function norm(v: string): string {
  const s = (v ?? '').replace(/\s+/g, ' ').trim();
  const low = s.toLowerCase();
  if (low === 'yes' || low === 'true' || low === 'y') return 'true';
  if (low === 'no' || low === 'false' || low === 'n') return 'false';
  const n = Number(s);
  if (s !== '' && !Number.isNaN(n)) return String(n); // 5 == 5.0 == "5 "
  // numeric lists ("9, 9, 8" vs "9,9,8"): comma-spacing is cosmetic, order is NOT
  // (droptable Indices/Tiers are position-correlated) — so canonicalize spacing
  // only, never sort
  if (/^[\d\s,.\-]+$/.test(s)) return s.replace(/\s*,\s*/g, ',');
  return s; // NB: no comma-sort here — prose/positional lists compare verbatim
}
// order-insensitive compare, used ONLY for columns whose Notion type is a
// set (multi_select or array rollup — propValue sorts those on the Notion side,
// so we sort the CSV side to match). List items may contain spaces (e.g. a
// Rewards rollup "4x Agency Reputation"), so this can't be inferred from the
// value — it's scoped by property type in diffTable.
function normList(v: string): string {
  return (v ?? '').split(',').map((x) => norm(x)).filter(Boolean).sort().join(',');
}
// order-PRESERVING normalization of a comma list — used to detect "same set,
// different order" on rollup columns, where order mirrors the relation order and
// can carry pairing meaning (droptable Indices[i] pairs with Tiers[i])
function normSeq(v: string): string {
  return (v ?? '').split(',').map((x) => norm(x)).filter(Boolean).join(',');
}

// deploy implication of a Notion Status, per the world-data flag mechanics
// (runbook Procedure B "Status flags"): --args ignores status, but a BULK deploy
// only writes these. Annotating each row with this tells the reviewer what
// applying + bulk-deploying it would actually do.
function deployImpl(status: string): string {
  // spelling-tolerant (Notion has "In-game" vs deploy's "In Game", etc.); this is
  // an advisory display hint — the actual deploy uses exact-string status matching
  const s = (status || '').trim().toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ');
  if (s === 'to deploy') return 'bulk-init candidate';
  if (s === 'to update' || s === 'revise deployment') return 'bulk-revise candidate';
  if (s === 'to remove') return 'bulk-DELETE candidate'; // toDelete() marker
  if (s === 'to delete') return 'delete-marked (inert: script wants "To Remove")';
  if (s === 'in game') return 'live';
  if (s === 'ready' || s === 'test') return 'staged (not bulk-auto)';
  return 'WIP / inert in bulk'; // Idea / Shelved / In Progress / In Review / blank
}
function implColor(impl: string): keyof typeof ANSI {
  if (impl.includes('DELETE') || impl.startsWith('delete-marked')) return 'red';
  if (impl.startsWith('bulk-')) return 'yellow';
  if (impl === 'live') return 'green';
  if (impl.startsWith('staged')) return 'blue';
  return 'gray';
}

function readCsv(rel: string): { headers: string[]; rows: Record<string, string>[] } {
  const raw = readFileSync(join(DATA_DIR, rel), 'utf8').replace(/^﻿/, '');
  const records = parse(raw, { columns: true, skip_empty_lines: true, relax_column_count: true });
  const headers = records.length ? Object.keys(records[0]) : [];
  return { headers, rows: records };
}

// aligned row: key · name(if distinct) · status · deploy-implication.
// pad() is ANSI-aware (measures visible width), so colored cells align.
// lookup tables (no Status property) ship with their parent row, not by status —
// annotating a status implication there would mislead, so say what's true instead.
function statusRow(key: string, name: string, status: string, isLookup = false): string {
  const keyCell = pad(c('gray', trunc(key, 20)), 21);
  const nm = name && name.trim() && name.trim() !== key.trim() ? trunc(name, 30) : '';
  const nameCell = pad(nm, 31);
  if (isLookup) return '    ' + keyCell + nameCell + pad(c('dim', '—'), 20) + c('gray', 'ships with parent row');
  const impl = deployImpl(status);
  const statCell = pad(c('dim', trunc(status || '—', 18)), 20);
  return '    ' + keyCell + nameCell + statCell + c(implColor(impl), impl);
}

// composite-key support: a mapping's key may be one column or several; several
// are joined into a single match key. Notion-side extraction returns null if any
// part is a complex/unparseable property (the row is then dropped + counted).
const keyCols = (m: Mapping) => (Array.isArray(m.key) ? m.key : [m.key]);
const keyLabel = (m: Mapping) => keyCols(m).join(' + ');
const joinKey = (parts: string[]) => parts.map((p) => norm(p)).join(' · ');

// returns a per-table verdict for the run recap; ok=false marks the run
// incomplete (skips and aborts must fail the gate, same as thrown errors)
async function diffTable(m: Mapping): Promise<{ ok: boolean; note: string }> {
  const { headers, rows: csvRows } = readCsv(m.csv);
  const kCols = keyCols(m);
  const kLabel = keyLabel(m);
  const firstWins = m.dupPolicy === 'first-wins';
  tableRule(m.label, `${m.csv} ⇄ "${m.db}"${m.filter ? ` [${m.filter.prop}=${m.filter.equals}]` : ''}`);
  const missingKeyCols = kCols.filter((k) => !headers.includes(k));
  if (missingKeyCols.length) {
    console.log(`    ${bad()} CSV has no "${missingKeyCols.join('", "')}" key column (headers: ${c('dim', headers.join(', '))}) — skipped`);
    return { ok: false, note: 'skipped: missing key column' };
  }

  const dbId = m.dbId ? await verifyDbId(m.dbId, m.db) : await resolveDbId(m.db);
  const pages = await queryAll(dbId);

  // build notion row map keyed by the key property (or joined composite), plus
  // which columns are comparable. Duplicate keys make matching ambiguous: the
  // default aborts the diff (the "undoubtedly linked" bar); 'first-wins' keeps
  // the first row exactly like the deploy pipeline's lookup maps do, and each
  // extra is classified — identical (dead row) vs CONFLICTING (deploy silently
  // ships only the first version).
  const notby = new Map<
    string,
    { vals: Record<string, string>; raw: Record<string, string>; status: string; name: string }
  >();
  const complexCols = new Set<string>(); // relation/files/... — surfaced, not diffed
  const multiSel = new Set<string>(); // multi_select cols — compared order-insensitively
  const rollupCols = new Set<string>(); // array rollups — set-compared, but order mirrors relation order
  const seenProp = new Set<string>(); // headers that exist as a Notion property at all
  const dupNotion: string[] = [];
  const conflictNotion: string[] = [];
  let hasStatusProp = false;
  let notionNullKey = 0, notionBlankKey = 0, filteredOut = 0;
  for (const pg of pages) {
    const props = pg.properties || {};
    // one Notion db can fan out into several filtered CSVs (e.g. Droptables by
    // Type) — rows outside this mapping's slice are not drift, just out of scope
    if (m.filter && norm(propValue(props[m.filter.prop]) ?? '') !== norm(m.filter.equals)) {
      filteredOut++;
      continue;
    }
    if (props['Status']) hasStatusProp = true;
    const keyParts = kCols.map((k) => propValue(props[k]));
    if (keyParts.some((v) => v === null)) { notionNullKey++; continue; } // complex/unparseable key type
    if (keyParts.every((v) => v === '')) { notionBlankKey++; continue; }
    const nk = joinKey(keyParts as string[]);
    const vals: Record<string, string> = {};
    const raw: Record<string, string> = {};
    for (const col of headers) {
      const p = props[col];
      if (p !== undefined) seenProp.add(col);
      // set-typed columns (multi_select / array rollup) compare order-insensitively
      if (p?.type === 'multi_select' || (p?.type === 'rollup' && p.rollup?.type === 'array')) multiSel.add(col);
      const pv = propValue(p);
      if (pv === null) { if (p) complexCols.add(col); continue; }
      vals[col] = pv;
      // keep the UNSORTED value of array rollups: their order mirrors the relation
      // order, which can pair with a sibling column (droptable Indices <-> Tiers)
      if (p?.type === 'rollup' && p.rollup?.type === 'array') {
        rollupCols.add(col);
        const els = (p.rollup.array || []).map((el: any) => propValue(el));
        if (!els.some((v: string | null) => v === null))
          raw[col] = els.map((v: string) => v.trim()).filter(Boolean).join(',');
      }
    }
    if (notby.has(nk)) {
      dupNotion.push(nk);
      const kept = notby.get(nk)!.vals;
      const conflicts = Object.keys(vals).some((col) => norm(kept[col] ?? '') !== norm(vals[col] ?? ''));
      if (conflicts) conflictNotion.push(nk);
      continue; // first-wins: keep the earlier row (matches deploy; in abort mode we abort anyway)
    }
    const nameProp = props['Name'] ?? props['Title']; // quests title their rows "Title"
    notby.set(nk, {
      vals,
      raw,
      status: props['Status'] ? propValue(props['Status']) ?? '' : '',
      name: nameProp ? propValue(nameProp) ?? '' : '',
    });
  }

  const csvby = new Map<string, Record<string, string>>();
  const dupCsv: string[] = [];
  const conflictCsv: string[] = [];
  let csvBlankKey = 0;
  for (const r of csvRows) {
    if (kCols.every((k) => !r[k]?.trim())) { csvBlankKey++; continue; }
    const nk = joinKey(kCols.map((k) => r[k] ?? ''));
    if (csvby.has(nk)) {
      dupCsv.push(nk);
      const kept = csvby.get(nk)!;
      // classify against deploy-relevant columns only — complex cols (relations
      // exported as row-unique notion.so URLs) would false-flag identical rows.
      // complexCols is complete here: the notion loop above populated it.
      const conflicts = headers.some(
        (col) => !complexCols.has(col) && norm(kept[col] ?? '') !== norm(r[col] ?? '')
      );
      if (conflicts) conflictCsv.push(nk);
      continue; // first-wins: keep the earlier row (matches deploy; in abort mode we abort anyway)
    }
    csvby.set(nk, r);
  }

  if (!firstWins && (dupNotion.length || dupCsv.length)) {
    console.log(`    ${bad()} ${c('red', 'ABORT')} key "${kLabel}" is NOT unique — csv dups: ${c('dim', '[' + [...new Set(dupCsv)].join(', ') + ']')} notion dups: ${c('dim', '[' + [...new Set(dupNotion)].join(', ') + ']')}`);
    console.log(c('dim', '      row-matching would be ambiguous; this table needs a composite key or dupPolicy. Not diffed.'));
    return { ok: false, note: 'ABORT: duplicate key' };
  }
  const isLookup = firstWins && !hasStatusProp;

  // a CSV column with no Notion property (renamed/deleted/misspelled) must NOT be
  // silently skipped — that could show "in sync" while a required column was never
  // compared. Surface it and exclude it from the compare set.
  const noProp = notby.size ? headers.filter((h) => h !== '' && !seenProp.has(h) && !complexCols.has(h)) : [];
  const comparable = headers.filter((h) => h !== '' && !complexCols.has(h) && !noProp.includes(h));
  const keyNote = firstWins
    ? dupCsv.length || dupNotion.length ? 'first-wins (deploy-faithful)' : 'unique (first-wins)'
    : 'unique';
  console.log(
    `    ${ok()} key "${kLabel}" ${keyNote}   ${c('dim', '·')}   ` +
    `csv ${c('bold', String(csvby.size))} ${c('dim', 'notion')} ${c('bold', String(notby.size))}   ${c('dim', '·')}   ` +
    `${c('dim', comparable.length + ' cols compared')}`
  );
  if (m.filter) {
    const inScope = pages.length - filteredOut;
    if (inScope === 0 && pages.length > 0)
      console.log(c('yellow', `      ! filter ${m.filter.prop}=${m.filter.equals} matched 0 of ${pages.length} notion rows — filter prop/value likely wrong`));
    else console.log(c('dim', `      ⋯ filter ${m.filter.prop}=${m.filter.equals}: ${inScope} of ${pages.length} notion rows in scope`));
  }
  if (complexCols.size) console.log(c('dim', `      ⋯ not compared (complex): ${[...complexCols].join(', ')}`));
  if (noProp.length) console.log(c('yellow', `      ! CSV columns with NO matching Notion property (never compared): ${noProp.join(', ')}`));
  if (notionNullKey) console.log(c('yellow', `      ! ${notionNullKey} notion row(s) dropped: key "${kLabel}" is a complex/unparseable type — mapping may be wrong`));
  if (notionBlankKey || csvBlankKey)
    console.log(c(firstWins ? 'yellow' : 'dim', `      ${firstWins ? '!' : '⋯'} dropped blank-key rows: ${notionBlankKey} notion / ${csvBlankKey} csv${firstWins ? ' — a blank-key lookup row is UNREACHABLE by deploy (dead row)' : ''}`));

  // duplicate-key report (first-wins tables only — abort mode never reaches here).
  // identical extras mirror deploy harmlessly; a CONFLICT means the deploy pipeline
  // silently ships only the first version — fix the source rows.
  const deadCsv = dupCsv.filter((k) => !conflictCsv.includes(k));
  const deadNotion = dupNotion.filter((k) => !conflictNotion.includes(k));
  if (deadCsv.length || deadNotion.length)
    console.log(c('dim', `      ⋯ duplicate keys (identical rows — dead, deploy uses the first): ${[...new Set([...deadCsv.map((k) => `csv:${k}`), ...deadNotion.map((k) => `notion:${k}`)])].join(', ')}`));
  for (const k of new Set(conflictCsv))
    console.log(`      ${bad()} ${c('red', 'CONFLICTING csv duplicate')} "${trunc(k, 48)}" — rows differ; deploy silently ships only the FIRST`);
  // csv first-wins mirrors deploy exactly (row order = deploy read order), so
  // cell-diffing the kept csv row is faithful. Notion query order carries NO
  // deploy meaning — a conflicting notion dup makes "which copy to diff"
  // arbitrary, so those keys are excluded from the cell diff until resolved.
  const conflictedNotionKeys = new Set(conflictNotion);
  for (const k of conflictedNotionKeys)
    console.log(`      ${bad()} ${c('red', 'CONFLICTING notion duplicate')} "${trunc(k, 48)}" — rows differ; cell diff skipped for this key, resolve the duplicate in Notion`);

  // rows only in notion = candidates to add (annotated with deploy implication)
  const onlyNotion = [...notby.entries()].filter(([k]) => !csvby.has(k));
  if (onlyNotion.length) {
    console.log('  ' + c('cyan', `+ only in Notion · ${onlyNotion.length}`));
    for (const [k, v] of onlyNotion) console.log(statusRow(k, v.name, v.status, isLookup));
  }

  // changed cells on matched rows. Array rollups are set-compared (their display
  // order in Notion is unstable), but their underlying order mirrors the relation
  // order — when the set matches and the sequence doesn't, surface it: a silent
  // re-pairing (droptable Indices vs Tiers) is exactly what a re-export would ship.
  let changed = 0;
  const changedLines: string[] = [];
  const orderDrift: string[] = [];
  for (const [k, cRow] of csvby) {
    const n = notby.get(k);
    if (!n) continue;
    if (conflictedNotionKeys.has(k)) continue; // which notion copy to diff is ambiguous
    const diffs: string[] = [];
    for (const col of comparable) {
      if (n.vals[col] === undefined) continue; // notion lacks this property on this row
      const cmp = (v: string) => (multiSel.has(col) ? normList(v) : norm(v));
      if (cmp(cRow[col] ?? '') !== cmp(n.vals[col]))
        diffs.push(`      ${pad(c('dim', col), 18)} ${c('red', JSON.stringify(cRow[col] ?? ''))} ${c('dim', '→')} ${c('green', JSON.stringify(n.vals[col]))}`);
      else if (rollupCols.has(col) && n.raw[col] !== undefined && normSeq(cRow[col] ?? '') !== normSeq(n.raw[col]))
        orderDrift.push(`${col} @ ${trunc(k, 30)}`);
    }
    if (diffs.length) {
      changed++;
      changedLines.push(statusRow(k, n.name, n.status, isLookup));
      changedLines.push(...diffs);
    }
  }
  if (changed) {
    console.log('  ' + c('yellow', `~ changed · ${changed}`));
    changedLines.forEach((l) => console.log(l));
  }
  if (orderDrift.length)
    console.log(
      '  ' + c('yellow', `⇅ same set, different order · ${orderDrift.length}`) +
      c('dim', '   (relation order changed — check position-paired columns before re-exporting)') +
      '\n' + c('dim', '      ' + orderDrift.slice(0, 8).join('  ·  ') + (orderDrift.length > 8 ? `  ·  +${orderDrift.length - 8} more` : ''))
    );

  // rows only in CSV = reverse drift (CSV should not hold rows Notion lacks)
  const onlyCsv = [...csvby.entries()].filter(([k]) => !notby.has(k));
  if (onlyCsv.length) {
    console.log('  ' + c('red', `! only in CSV · ${onlyCsv.length}`) + c('dim', '   (reverse drift — in the deploy vehicle, absent from Notion; verify before trusting)'));
    for (const [k, r] of onlyCsv) console.log('    ' + pad(c('gray', trunc(k, 20)), 21) + trunc(r['Name'] || '', 34));
  }

  if (!onlyNotion.length && !onlyCsv.length && !changed) console.log('  ' + c('green', '= in sync'));
  else
    console.log(
      '  ' + c('dim', 'summary  ') +
      c('cyan', `+${onlyNotion.length}`) + c('dim', ' notion-only  ') +
      c('yellow', `~${changed}`) + c('dim', ' changed  ') +
      c('red', `!${onlyCsv.length}`) + c('dim', ' csv-only')
    );

  const noteParts: string[] = [];
  if (onlyNotion.length) noteParts.push(`+${onlyNotion.length}`);
  if (changed) noteParts.push(`~${changed}`);
  if (onlyCsv.length) noteParts.push(`!${onlyCsv.length}`);
  if (orderDrift.length) noteParts.push(`⇅${orderDrift.length}`);
  const conflicts = new Set([...conflictCsv, ...conflictNotion]).size;
  if (conflicts) noteParts.push(`CONFLICT×${conflicts}`);
  return { ok: true, note: noteParts.length ? noteParts.join(' ') : 'in sync' };
}

async function run() {
  if (!TOKEN) throw new Error('NOTION_PAT not set in the env file (.env.<NODE_ENV>)');
  const targets = argv.table ? MAPPINGS.filter((m) => m.label.includes(argv.table)) : MAPPINGS;
  if (!targets.length) throw new Error(`no mapping matches --table "${argv.table}"`);
  titleCard(targets.length);
  const results: { label: string; ok: boolean; note: string }[] = [];
  for (const m of targets) {
    try {
      results.push({ label: m.label, ...(await diffTable(m)) });
    } catch (e: any) {
      results.push({ label: m.label, ok: false, note: `FAILED: ${e.message}` });
      console.log(`    ${bad()} ${c('red', m.label + ' failed')}: ${e.message}`);
    }
  }

  // recap: one line per table so a 28-table run is scannable at a glance
  console.log('\n' + c('violetDim', '─'.repeat(RULE_W)));
  console.log('  ' + c('bold', 'recap'));
  for (const r of results) {
    const icon = !r.ok ? bad() : r.note === 'in sync' ? c('green', '=') : c('yellow', '~');
    const noteColor: keyof typeof ANSI =
      !r.ok || r.note.includes('CONFLICT') ? 'red' : r.note === 'in sync' ? 'green' : 'yellow';
    console.log(`  ${icon} ${pad(r.label, 28)}${c(noteColor, r.note)}`);
  }

  const failures = results.filter((r) => !r.ok).length;
  const clean = results.filter((r) => r.ok && r.note === 'in sync').length;
  const drifted = results.length - failures - clean;
  console.log('\n' + c('violetDim', '─'.repeat(RULE_W)));
  if (failures) {
    // exit non-zero so a review gate never accepts a run that skipped, aborted,
    // or errored a table — an incomplete diff must not read as a clean one
    console.log(c('red', `done with ${failures} of ${results.length} table(s) FAILED — this diff is INCOMPLETE`) + '\n');
    process.exitCode = 1;
  } else {
    console.log(
      c('dim', `done · ${results.length} table${results.length === 1 ? '' : 's'} · `) + c('green', `${clean} in sync`) + c('dim', ' · ') +
      (drifted ? c('yellow', `${drifted} drifted`) : c('dim', '0 drifted')) +
      c('dim', ' · read-only · no CSV was written, nothing was deployed') + '\n'
    );
  }
}

run().catch((e) => {
  console.error(c('red', e.message || String(e)));
  process.exit(1);
});
