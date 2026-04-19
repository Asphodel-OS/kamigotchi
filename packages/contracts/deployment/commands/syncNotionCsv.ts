const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
import dotenv from 'dotenv';

import {
  normalizeSheetKey,
  syncNotionSheets,
  type SyncNotionSheetsOptions,
} from '../world/notion/sync';

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 [--sheet <category/name>] [--config <path>] [--dry-run]')
  .option('sheet', {
    alias: 's',
    type: 'string',
    describe: 'Comma-separated list of sheet keys, e.g. items/items,rooms/rooms',
  })
  .option('config', {
    alias: 'c',
    type: 'string',
    describe: 'Path to Notion sheets JSON config',
    default: process.env.NOTION_SHEETS_FILE ?? 'deployment/world/notion/sheets.json',
  })
  .option('dry-run', {
    type: 'boolean',
    describe: 'Fetch and transform data without writing CSV files',
    default: false,
  })
  .option('api-version', {
    type: 'string',
    describe: 'Notion API version header',
    default: process.env.NOTION_API_VERSION ?? '2022-06-28',
  })
  .strict()
  .help().argv;

const run = async () => {
  const sheets = argv.sheet
    ? argv.sheet
        .split(',')
        .map((entry: string) => normalizeSheetKey(entry))
        .filter(Boolean)
    : undefined;

  const options: SyncNotionSheetsOptions = {
    configPath: argv.config,
    sheetKeys: sheets,
    apiVersion: argv['api-version'],
    dryRun: argv['dry-run'],
  };

  const results = await syncNotionSheets(options);

  console.log(
    `\nNotion sync complete (${results.length} sheet${results.length === 1 ? '' : 's'})${
      argv['dry-run'] ? ' [dry-run]' : ''
    }`);

  for (const result of results) {
    console.log(
      `- ${result.key}: ${result.rows} rows, ${result.columns} columns${
        result.wroteFile ? ` -> ${result.targetPath}` : ' (no file written)'
      }`
    );
  }
};

run().catch((error) => {
  console.error('Notion CSV sync failed');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
