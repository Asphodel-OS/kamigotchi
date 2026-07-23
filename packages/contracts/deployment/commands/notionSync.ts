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
const FMT_TTY =
  process.env.NO_COLOR == null &&
  (process.env.FORCE_COLOR === '1' || process.stdout.isTTY === true || !!process.env.npm_lifecycle_event);
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
    const res = await fetch(`${NOTION}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Notion-Version': VERSION,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 429 && attempt < 5) {
      await sleep(1000 * (attempt + 1));
      continue;
    }
    const json = await res.json();
    if (!res.ok) throw new Error(`notion ${path}: ${json.message || res.status}`);
    return json;
  }
}

async function resolveDbId(name: string): Promise<string> {
  const res = await notion('/search', {
    query: name,
    filter: { property: 'object', value: 'database' },
  });
  const hit = res.results.find(
    (r: any) => r.title?.map((t: any) => t.plain_text).join('').trim() === name
  );
  if (!hit) throw new Error(`database "${name}" not visible to the integration (share it, or fix the name)`);
  return hit.id;
}

// pull every row of a database (paginated)
async function queryAll(dbId: string): Promise<any[]> {
  const rows: any[] = [];
  let cursor: string | undefined;
  do {
    const res = await notion(`/databases/${dbId}/query`, cursor ? { start_cursor: cursor } : {});
    rows.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
    if (cursor) await sleep(350);
  } while (cursor);
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

// normalize a value for order-insensitive, whitespace-tolerant, numeric compare
function norm(v: string): string {
  const s = (v ?? '').replace(/\s+/g, ' ').trim();
  // canonicalize booleans so CSV "Yes"/"No" == Notion checkbox "true"/"false"
  const low = s.toLowerCase();
  if (low === 'yes' || low === 'true' || low === 'y') return 'true';
  if (low === 'no' || low === 'false' || low === 'n') return 'false';
  const n = Number(s);
  if (s !== '' && !Number.isNaN(n)) return String(n); // 5 == 5.0 == "5 "
  if (s.includes(',')) return s.split(',').map((x) => x.trim()).filter(Boolean).sort().join(',');
  return s;
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
  if (s === 'in game') return 'live';
  if (s === 'ready' || s === 'test') return 'staged (not bulk-auto)';
  return 'WIP / inert in bulk'; // Idea / Shelved / In Progress / In Review / blank
}
function implColor(impl: string): keyof typeof ANSI {
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
function statusRow(key: string, name: string, status: string): string {
  const impl = deployImpl(status);
  const keyCell = pad(c('gray', trunc(key, 20)), 21);
  const nm = name && name.trim() && name.trim() !== key.trim() ? trunc(name, 30) : '';
  const nameCell = pad(nm, 31);
  const statCell = pad(c('dim', status || '—'), 14);
  return '    ' + keyCell + nameCell + statCell + c(implColor(impl), impl);
}

async function diffTable(m: Mapping) {
  const { headers, rows: csvRows } = readCsv(m.csv);
  tableRule(m.label, `${m.csv} ⇄ "${m.db}"`);
  if (!headers.includes(m.key)) {
    console.log(`    ${bad()} CSV has no "${m.key}" key column (headers: ${c('dim', headers.join(', '))}) — skipped`);
    return;
  }

  const dbId = await resolveDbId(m.db);
  const pages = await queryAll(dbId);

  // build notion row map keyed by the key property, plus which columns are
  // comparable. dupKeys guards correctness: if the key repeats on either side,
  // matching is ambiguous and we must NOT diff (the "undoubtedly linked" bar).
  const notby = new Map<string, { vals: Record<string, string>; status: string; name: string }>();
  const complexCols = new Set<string>();
  const dupNotion: string[] = [];
  for (const pg of pages) {
    const props = pg.properties || {};
    const keyVal = propValue(props[m.key]);
    if (keyVal === null || keyVal === '') continue;
    const nk = norm(keyVal);
    if (notby.has(nk)) dupNotion.push(nk);
    const vals: Record<string, string> = {};
    for (const col of headers) {
      const pv = propValue(props[col]);
      if (pv === null) { if (props[col]) complexCols.add(col); continue; }
      vals[col] = pv;
    }
    notby.set(nk, {
      vals,
      status: props['Status'] ? propValue(props['Status']) ?? '' : '',
      name: props['Name'] ? propValue(props['Name']) ?? '' : '',
    });
  }

  const csvby = new Map<string, Record<string, string>>();
  const dupCsv: string[] = [];
  for (const r of csvRows) {
    if (!r[m.key]?.trim()) continue;
    const nk = norm(r[m.key]);
    if (csvby.has(nk)) dupCsv.push(nk);
    csvby.set(nk, r);
  }

  if (dupNotion.length || dupCsv.length) {
    console.log(`    ${bad()} ${c('red', 'ABORT')} key "${m.key}" is NOT unique — csv dups: ${c('dim', '[' + [...new Set(dupCsv)].join(', ') + ']')} notion dups: ${c('dim', '[' + [...new Set(dupNotion)].join(', ') + ']')}`);
    console.log(c('dim', '      row-matching would be ambiguous; this table needs a composite key. Not diffed.'));
    return;
  }

  const comparable = headers.filter((h) => !complexCols.has(h) && h !== '');
  console.log(
    `    ${ok()} key "${m.key}" unique   ${c('dim', '·')}   ` +
    `csv ${c('bold', String(csvby.size))} ${c('dim', 'notion')} ${c('bold', String(notby.size))}   ${c('dim', '·')}   ` +
    `${c('dim', comparable.length + ' cols compared')}`
  );
  if (complexCols.size) console.log(c('dim', `      ⋯ not compared (complex): ${[...complexCols].join(', ')}`));

  // rows only in notion = candidates to add (annotated with deploy implication)
  const onlyNotion = [...notby.entries()].filter(([k]) => !csvby.has(k));
  if (onlyNotion.length) {
    console.log('  ' + c('cyan', `+ only in Notion · ${onlyNotion.length}`));
    for (const [k, v] of onlyNotion) console.log(statusRow(k, v.name, v.status));
  }

  // changed cells on matched rows
  let changed = 0;
  const changedLines: string[] = [];
  for (const [k, cRow] of csvby) {
    const n = notby.get(k);
    if (!n) continue;
    const diffs: string[] = [];
    for (const col of comparable) {
      if (n.vals[col] === undefined) continue; // notion lacks this property
      if (norm(cRow[col] ?? '') !== norm(n.vals[col]))
        diffs.push(`      ${pad(c('dim', col), 18)} ${c('red', JSON.stringify(cRow[col] ?? ''))} ${c('dim', '→')} ${c('green', JSON.stringify(n.vals[col]))}`);
    }
    if (diffs.length) {
      changed++;
      changedLines.push(statusRow(k, n.name, n.status));
      changedLines.push(...diffs);
    }
  }
  if (changed) {
    console.log('  ' + c('yellow', `~ changed · ${changed}`));
    changedLines.forEach((l) => console.log(l));
  }

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
}

async function run() {
  if (!TOKEN) throw new Error('NOTION_PAT not set in the env file (.env.<NODE_ENV>)');
  const targets = argv.table ? MAPPINGS.filter((m) => m.label.includes(argv.table)) : MAPPINGS;
  if (!targets.length) throw new Error(`no mapping matches --table "${argv.table}"`);
  titleCard(targets.length);
  for (const m of targets) {
    try {
      await diffTable(m);
    } catch (e: any) {
      console.log(`    ${bad()} ${c('red', m.label + ' failed')}: ${e.message}`);
    }
  }
  console.log('\n' + c('violetDim', '─'.repeat(RULE_W)));
  console.log(c('dim', 'done · read-only · no CSV was written, nothing was deployed') + '\n');
}

run().catch((e) => {
  console.error(c('red', e.message || String(e)));
  process.exit(1);
});
