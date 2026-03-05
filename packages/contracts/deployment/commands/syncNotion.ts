import { Client } from '@notionhq/client';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

dotenv.config();

// ─── Types ───────────────────────────────────────────────────────────────────

interface ColumnDef {
  notion: string;
  csv: string;
  type: string;
}

interface DatabaseConfig {
  databaseId: string;
  columns: ColumnDef[];
}

type SyncConfig = Record<string, DatabaseConfig>;

// ─── Config ──────────────────────────────────────────────────────────────────

const CONFIG_PATH = path.resolve(__dirname, '../config/notion-sync.json');
const DATA_DIR = path.resolve(__dirname, '../world/data');

function loadConfig(): SyncConfig {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
}

// ─── Notion Client ───────────────────────────────────────────────────────────

function createClient(): Client {
  const key = process.env.NOTION_API_KEY;
  if (!key) {
    console.error('Missing NOTION_API_KEY in environment. Add it to .env');
    process.exit(1);
  }
  return new Client({ auth: key });
}

// ─── Paginated Fetch ─────────────────────────────────────────────────────────

async function fetchAllPages(client: Client, databaseId: string): Promise<any[]> {
  const pages: any[] = [];
  let cursor: string | undefined;
  do {
    const res: any = await client.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
      page_size: 100,
    });
    pages.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return pages;
}

// ─── Page Cache (for relation lookups) ───────────────────────────────────────

const pageCache = new Map<string, { title: string; url: string }>();

async function getPageInfo(
  client: Client,
  pageId: string
): Promise<{ title: string; url: string }> {
  if (pageCache.has(pageId)) return pageCache.get(pageId)!;
  try {
    const page: any = await client.pages.retrieve({ page_id: pageId });
    const url = page.url || '';
    let title = '';
    for (const prop of Object.values(page.properties) as any[]) {
      if (prop.type === 'title' && prop.title?.length) {
        title = prop.title.map((t: any) => t.plain_text).join('');
        break;
      }
    }
    const info = { title, url };
    pageCache.set(pageId, info);
    return info;
  } catch {
    const fallback = { title: '', url: '' };
    pageCache.set(pageId, fallback);
    return fallback;
  }
}

// ─── Property Extraction ─────────────────────────────────────────────────────

async function extractProperty(
  client: Client,
  prop: any,
  type: string
): Promise<string> {
  if (!prop) return '';

  switch (type) {
    case 'title':
      return (prop.title || []).map((t: any) => t.plain_text).join('');

    case 'rich_text':
      return (prop.rich_text || []).map((t: any) => t.plain_text).join('');

    case 'number': {
      const n = prop.number;
      return n != null ? String(n) : '';
    }

    case 'select':
      return prop.select?.name || '';

    case 'multi_select':
      return (prop.multi_select || []).map((s: any) => s.name).join(', ');

    case 'checkbox':
      // Checkboxes in the CSV are empty (unchecked rows are still included)
      return '';

    case 'url':
      return prop.url || '';

    case 'date':
      return prop.date?.start || '';

    case 'email':
      return prop.email || '';

    case 'formula': {
      const f = prop.formula;
      if (!f) return '';
      if (f.type === 'string') return f.string || '';
      if (f.type === 'number') return f.number != null ? String(f.number) : '';
      if (f.type === 'boolean') return f.boolean ? 'true' : 'false';
      if (f.type === 'date') return f.date?.start || '';
      return '';
    }

    case 'rollup': {
      const r = prop.rollup;
      if (!r) return '';
      if (r.type === 'number') return r.number != null ? String(r.number) : '';
      if (r.type === 'array') {
        return r.array
          .map((item: any) => {
            if (item.type === 'title')
              return item.title?.map((t: any) => t.plain_text).join('') || '';
            if (item.type === 'rich_text')
              return item.rich_text?.map((t: any) => t.plain_text).join('') || '';
            if (item.type === 'number')
              return item.number != null ? String(item.number) : '';
            return '';
          })
          .join(', ');
      }
      return '';
    }

    case 'files':
      return (prop.files || [])
        .map((f: any) => {
          if (f.type === 'file') return f.file?.url || '';
          if (f.type === 'external') return f.external?.url || '';
          return f.name || '';
        })
        .join(', ');

    case 'people':
      return (prop.people || []).map((p: any) => p.name || p.id).join(', ');

    case 'relation_with_url': {
      const relations = prop.relation || [];
      const parts: string[] = [];
      for (const rel of relations) {
        const info = await getPageInfo(client, rel.id);
        if (info.title) {
          parts.push(info.url ? `${info.title} (${info.url})` : info.title);
        }
      }
      return parts.join(', ');
    }

    default:
      return '';
  }
}

// ─── CSV Utilities ───────────────────────────────────────────────────────────

function escapeCsvField(value: string): string {
  if (!value) return '';
  // Quote if the value contains commas, double quotes, or newlines
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

function buildCsvContent(headers: string[], rows: string[][]): string {
  const BOM = '\uFEFF';
  const headerLine = headers.map(escapeCsvField).join(',');
  const dataLines = rows.map((row) => row.map(escapeCsvField).join(','));
  return BOM + [headerLine, ...dataLines].join('\n') + '\n';
}

// ─── Sync One Database ───────────────────────────────────────────────────────

async function syncDatabase(
  client: Client,
  key: string,
  config: DatabaseConfig
): Promise<void> {
  if (!config.databaseId) {
    console.log(`  SKIP ${key} (no databaseId)`);
    return;
  }

  const pages = await fetchAllPages(client, config.databaseId);
  console.log(`  Fetched ${pages.length} pages from ${key}`);

  const headers = config.columns.map((c) => c.csv);
  const rows: string[][] = [];

  for (const page of pages) {
    const row: string[] = [];
    for (const col of config.columns) {
      const prop = page.properties[col.notion];
      const value = await extractProperty(client, prop, col.type);
      row.push(value);
    }
    rows.push(row);
  }

  const csvContent = buildCsvContent(headers, rows);
  const outPath = path.join(DATA_DIR, key + '.csv');

  // Ensure directory exists
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, csvContent, 'utf-8');
  console.log(`  Wrote ${outPath}`);
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option('all', {
      type: 'boolean',
      description: 'Sync all databases',
    })
    .option('category', {
      type: 'string',
      description: 'Sync all databases in a category (e.g. "items", "rooms")',
    })
    .option('file', {
      type: 'string',
      description: 'Sync a single database by key (e.g. "items/items")',
    })
    .check((argv) => {
      if (!argv.all && !argv.category && !argv.file) {
        throw new Error('Specify --all, --category <name>, or --file <key>');
      }
      return true;
    })
    .parse();

  const config = loadConfig();
  const client = createClient();
  const allKeys = Object.keys(config);

  let keysToSync: string[];

  if (argv.file) {
    if (!config[argv.file]) {
      console.error(`Unknown key: ${argv.file}`);
      console.error(`Available keys: ${allKeys.join(', ')}`);
      process.exit(1);
    }
    keysToSync = [argv.file];
  } else if (argv.category) {
    keysToSync = allKeys.filter((k) => k.startsWith(argv.category + '/'));
    if (!keysToSync.length) {
      const categories = [...new Set(allKeys.map((k) => k.split('/')[0]))];
      console.error(`No databases found for category: ${argv.category}`);
      console.error(`Available categories: ${categories.join(', ')}`);
      process.exit(1);
    }
  } else {
    keysToSync = allKeys;
  }

  console.log(`Syncing ${keysToSync.length} database(s)...\n`);

  let successes = 0;
  let failures = 0;

  for (const key of keysToSync) {
    try {
      console.log(`[${key}]`);
      await syncDatabase(client, key, config[key]);
      successes++;
    } catch (err: any) {
      console.error(`  ERROR syncing ${key}: ${err.message}`);
      failures++;
    }
    console.log('');
  }

  console.log(`Done. ${successes} succeeded, ${failures} failed.`);
  if (failures > 0) process.exit(1);
}

main();
