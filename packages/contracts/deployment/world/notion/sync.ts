import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const NOTION_BASE_URL = 'https://api.notion.com';
const DEFAULT_NOTION_API_VERSION = '2022-06-28';
const DEFAULT_CONFIG_PATH = path.join(__dirname, 'sheets.json');
const DATA_ROOT_PATH = path.join(__dirname, '..', 'data');
const DEFAULT_PAGE_SIZE = 100;

type NotionSourceType = 'database' | 'data_source';

type NotionSheetConfig = {
  id: string;
  sourceType?: NotionSourceType;
  query?: Record<string, unknown>;
  columns?: string[];
  propertyMap?: Record<string, string>;
};

type NotionSheetManifest = Record<string, NotionSheetConfig>;

export type SyncNotionSheetsOptions = {
  configPath?: string;
  sheetKeys?: string[];
  token?: string;
  apiVersion?: string;
  dryRun?: boolean;
};

export type SyncedNotionSheetResult = {
  key: string;
  targetPath: string;
  rows: number;
  pages: number;
  columns: number;
  wroteFile: boolean;
};

type NotionClientConfig = {
  token: string;
  apiVersion: string;
};

type NotionQueryResponse = {
  results: unknown[];
  has_more?: boolean;
  next_cursor?: string | null;
};

type NotionPage = {
  object?: string;
  properties?: Record<string, unknown>;
};

class NotionHttpError extends Error {
  status: number;
  payload: string;

  constructor(status: number, payload: string) {
    super(`Notion API request failed (${status})`);
    this.status = status;
    this.payload = payload;
  }
}

export const normalizeSheetKey = (raw: string): string => raw.trim().replace(/\.csv$/i, '');

export async function syncNotionSheets(
  options: SyncNotionSheetsOptions = {}
): Promise<SyncedNotionSheetResult[]> {
  const token = options.token ?? process.env.NOTION_TOKEN;
  if (!token) {
    throw new Error('Missing Notion token. Set NOTION_TOKEN in env or pass options.token');
  }

  const configPath = resolveConfigPath(options.configPath ?? process.env.NOTION_SHEETS_FILE);
  const manifest = loadManifest(configPath);
  const keys = selectSheetKeys(manifest, options.sheetKeys);
  const apiVersion = options.apiVersion ?? process.env.NOTION_API_VERSION ?? DEFAULT_NOTION_API_VERSION;
  const client: NotionClientConfig = { token, apiVersion };

  const results: SyncedNotionSheetResult[] = [];
  for (const key of keys) {
    const config = manifest[key];
    const result = await syncSingleSheet(key, config, client, !!options.dryRun);
    results.push(result);
  }

  return results;
}

function resolveConfigPath(configPath?: string): string {
  if (configPath) {
    return path.isAbsolute(configPath) ? configPath : path.join(process.cwd(), configPath);
  }

  return DEFAULT_CONFIG_PATH;
}

function loadManifest(configPath: string): NotionSheetManifest {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Notion sheet config not found: ${configPath}`);
  }

  const raw = fs.readFileSync(configPath, 'utf8');
  const parsed = JSON.parse(raw) as unknown;

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`Invalid Notion sheet config in ${configPath}. Expected an object map.`);
  }

  const manifest: NotionSheetManifest = {};
  for (const [rawKey, rawConfig] of Object.entries(parsed)) {
    const key = normalizeSheetKey(rawKey);
    if (!rawConfig || typeof rawConfig !== 'object' || Array.isArray(rawConfig)) {
      throw new Error(`Invalid config for sheet key "${rawKey}" in ${configPath}`);
    }

    const typed = rawConfig as NotionSheetConfig;
    if (!typed.id || typeof typed.id !== 'string') {
      throw new Error(`Missing required "id" for sheet key "${rawKey}" in ${configPath}`);
    }

    manifest[key] = typed;
  }

  return manifest;
}

function selectSheetKeys(manifest: NotionSheetManifest, requestedKeys?: string[]): string[] {
  if (!requestedKeys || requestedKeys.length === 0) {
    return Object.keys(manifest).sort();
  }

  const normalized = requestedKeys.map(normalizeSheetKey).filter(Boolean);
  const missing = normalized.filter((key) => !manifest[key]);
  if (missing.length > 0) {
    throw new Error(`Unknown sheet key(s): ${missing.join(', ')}`);
  }

  return normalized;
}

async function syncSingleSheet(
  key: string,
  config: NotionSheetConfig,
  client: NotionClientConfig,
  dryRun: boolean
): Promise<SyncedNotionSheetResult> {
  const targetPath = path.join(DATA_ROOT_PATH, `${key}.csv`);
  const columns = resolveColumns(config, targetPath, key);

  const pages = await queryPages(client, config);
  const rows = pages.map((page) => buildCsvRow(page, columns, config.propertyMap));
  const csvPayload = serializeCsv(columns, rows);

  if (!dryRun) {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, csvPayload, { encoding: 'utf8' });
  }

  return {
    key,
    targetPath,
    rows: rows.length,
    pages: pages.length,
    columns: columns.length,
    wroteFile: !dryRun,
  };
}

function resolveColumns(config: NotionSheetConfig, targetPath: string, key: string): string[] {
  if (config.columns && config.columns.length > 0) {
    return config.columns;
  }

  if (!fs.existsSync(targetPath)) {
    throw new Error(
      `No existing CSV found for ${key}. Provide \"columns\" in sheet config or create ${targetPath}`
    );
  }

  const currentCsv = fs.readFileSync(targetPath, 'utf8');
  const records = parse(currentCsv, { bom: true, to_line: 1 }) as unknown;

  if (!Array.isArray(records) || records.length === 0 || !Array.isArray(records[0])) {
    throw new Error(`Unable to infer CSV headers from ${targetPath}`);
  }

  return (records[0] as unknown[]).map((column) => String(column));
}

async function queryPages(client: NotionClientConfig, config: NotionSheetConfig): Promise<NotionPage[]> {
  const preferredSource: NotionSourceType = config.sourceType ?? 'database';

  try {
    return await queryPagesBySource(client, config.id, preferredSource, config.query);
  } catch (error) {
    if (config.sourceType || !(error instanceof NotionHttpError) || error.status !== 404) {
      throw error;
    }

    return await queryPagesBySource(client, config.id, 'data_source', config.query);
  }
}

async function queryPagesBySource(
  client: NotionClientConfig,
  id: string,
  sourceType: NotionSourceType,
  baseQuery?: Record<string, unknown>
): Promise<NotionPage[]> {
  const sourcePath = sourceType === 'data_source' ? 'data_sources' : 'databases';

  const pages: NotionPage[] = [];
  let cursor: string | undefined;

  while (true) {
    const payload: Record<string, unknown> = {
      page_size: DEFAULT_PAGE_SIZE,
      ...(baseQuery ?? {}),
    };

    if (cursor) payload.start_cursor = cursor;

    const response = (await notionRequest(
      client,
      `/v1/${sourcePath}/${id}/query`,
      payload
    )) as NotionQueryResponse;

    const results = Array.isArray(response.results) ? response.results : [];
    for (const result of results) {
      const page = result as NotionPage;
      if (page.object === 'page') pages.push(page);
    }

    if (!response.has_more || !response.next_cursor) {
      break;
    }

    cursor = response.next_cursor;
  }

  return pages;
}

async function notionRequest(
  client: NotionClientConfig,
  pathname: string,
  payload: Record<string, unknown>
): Promise<unknown> {
  const response = await fetch(`${NOTION_BASE_URL}${pathname}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${client.token}`,
      'Content-Type': 'application/json',
      'Notion-Version': client.apiVersion,
    },
    body: JSON.stringify(payload),
  });

  const bodyText = await response.text();

  if (!response.ok) {
    throw new NotionHttpError(response.status, bodyText);
  }

  if (!bodyText.trim()) {
    return {};
  }

  return JSON.parse(bodyText) as unknown;
}

function buildCsvRow(
  page: NotionPage,
  columns: string[],
  propertyMap?: Record<string, string>
): Record<string, string> {
  const properties = page.properties ?? {};
  const row: Record<string, string> = {};

  for (const column of columns) {
    const notionPropertyName = propertyMap?.[column] ?? column;
    row[column] = propertyToString(properties[notionPropertyName]);
  }

  return row;
}

function propertyToString(property: unknown): string {
  if (!property || typeof property !== 'object') return '';

  const prop = property as Record<string, unknown>;
  const type = typeof prop.type === 'string' ? prop.type : '';

  switch (type) {
    case 'title':
      return richTextArrayToString(prop.title);
    case 'rich_text':
      return richTextArrayToString(prop.rich_text);
    case 'number': {
      const value = prop.number;
      return value === null || value === undefined ? '' : String(value);
    }
    case 'select':
      return optionName(prop.select);
    case 'multi_select':
      return optionNameArray(prop.multi_select);
    case 'status':
      return optionName(prop.status);
    case 'checkbox':
      return prop.checkbox ? 'TRUE' : 'FALSE';
    case 'url':
      return valueOrEmpty(prop.url);
    case 'email':
      return valueOrEmpty(prop.email);
    case 'phone_number':
      return valueOrEmpty(prop.phone_number);
    case 'date':
      return dateToString(prop.date);
    case 'relation':
      return relationToString(prop.relation);
    case 'people':
      return peopleToString(prop.people);
    case 'formula':
      return formulaToString(prop.formula);
    case 'rollup':
      return rollupToString(prop.rollup);
    case 'files':
      return filesToString(prop.files);
    case 'created_time':
      return valueOrEmpty(prop.created_time);
    case 'last_edited_time':
      return valueOrEmpty(prop.last_edited_time);
    case 'created_by':
      return userToString(prop.created_by);
    case 'last_edited_by':
      return userToString(prop.last_edited_by);
    case 'unique_id':
      return uniqueIdToString(prop.unique_id);
    default:
      return '';
  }
}

function richTextArrayToString(value: unknown): string {
  if (!Array.isArray(value)) return '';
  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return '';
      const text = (entry as Record<string, unknown>).plain_text;
      return typeof text === 'string' ? text : '';
    })
    .join('');
}

function optionName(value: unknown): string {
  if (!value || typeof value !== 'object') return '';
  const name = (value as Record<string, unknown>).name;
  return typeof name === 'string' ? name : '';
}

function optionNameArray(value: unknown): string {
  if (!Array.isArray(value)) return '';
  return value.map(optionName).filter(Boolean).join(', ');
}

function valueOrEmpty(value: unknown): string {
  return value === null || value === undefined ? '' : String(value);
}

function dateToString(value: unknown): string {
  if (!value || typeof value !== 'object') return '';
  const date = value as Record<string, unknown>;
  const start = typeof date.start === 'string' ? date.start : '';
  const end = typeof date.end === 'string' ? date.end : '';
  if (!start) return '';
  return end ? `${start} -> ${end}` : start;
}

function relationToString(value: unknown): string {
  if (!Array.isArray(value)) return '';
  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return '';
      const id = (entry as Record<string, unknown>).id;
      return typeof id === 'string' ? id : '';
    })
    .filter(Boolean)
    .join(', ');
}

function peopleToString(value: unknown): string {
  if (!Array.isArray(value)) return '';
  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return '';
      const user = entry as Record<string, unknown>;
      if (typeof user.name === 'string' && user.name) return user.name;
      if (typeof user.id === 'string') return user.id;
      return '';
    })
    .filter(Boolean)
    .join(', ');
}

function formulaToString(value: unknown): string {
  if (!value || typeof value !== 'object') return '';
  const formula = value as Record<string, unknown>;
  const type = typeof formula.type === 'string' ? formula.type : '';

  switch (type) {
    case 'string':
      return valueOrEmpty(formula.string);
    case 'number': {
      const num = formula.number;
      return num === null || num === undefined ? '' : String(num);
    }
    case 'boolean':
      return formula.boolean ? 'TRUE' : 'FALSE';
    case 'date':
      return dateToString(formula.date);
    default:
      return '';
  }
}

function rollupToString(value: unknown): string {
  if (!value || typeof value !== 'object') return '';
  const rollup = value as Record<string, unknown>;
  const type = typeof rollup.type === 'string' ? rollup.type : '';

  switch (type) {
    case 'number':
      return valueOrEmpty(rollup.number);
    case 'date':
      return dateToString(rollup.date);
    case 'array': {
      if (!Array.isArray(rollup.array)) return '';
      return rollup.array
        .map((entry) => propertyToString(entry))
        .filter(Boolean)
        .join(', ');
    }
    default:
      return '';
  }
}

function filesToString(value: unknown): string {
  if (!Array.isArray(value)) return '';
  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return '';
      const file = entry as Record<string, unknown>;
      const name = typeof file.name === 'string' ? file.name : '';
      const type = typeof file.type === 'string' ? file.type : '';
      if (type === 'external' && file.external && typeof file.external === 'object') {
        const url = (file.external as Record<string, unknown>).url;
        if (typeof url === 'string' && url) return url;
      }
      if (type === 'file' && file.file && typeof file.file === 'object') {
        const url = (file.file as Record<string, unknown>).url;
        if (typeof url === 'string' && url) return url;
      }
      return name;
    })
    .filter(Boolean)
    .join(', ');
}

function userToString(value: unknown): string {
  if (!value || typeof value !== 'object') return '';
  const user = value as Record<string, unknown>;
  if (typeof user.name === 'string' && user.name) return user.name;
  if (typeof user.id === 'string') return user.id;
  return '';
}

function uniqueIdToString(value: unknown): string {
  if (!value || typeof value !== 'object') return '';
  const uniqueId = value as Record<string, unknown>;
  const number = uniqueId.number;
  const prefix = uniqueId.prefix;
  const num = number === null || number === undefined ? '' : String(number);
  const pre = typeof prefix === 'string' ? prefix : '';
  return `${pre}${num}`;
}

function serializeCsv(columns: string[], rows: Record<string, string>[]): string {
  const lines: string[] = [];
  lines.push(columns.map(escapeCsvCell).join(','));

  for (const row of rows) {
    lines.push(columns.map((column) => escapeCsvCell(row[column] ?? '')).join(','));
  }

  return `${lines.join('\n')}\n`;
}

function escapeCsvCell(rawValue: string): string {
  const value = String(rawValue ?? '');
  if (!/[",\n\r]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
}
