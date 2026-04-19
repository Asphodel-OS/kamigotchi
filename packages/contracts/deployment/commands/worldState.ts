const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
import dotenv from 'dotenv';
import execa from 'execa';
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

import { ethers } from 'ethers';
import { genInitScript } from '../scripts/worldIniter';
import { ignoreSolcErrors, setAutoMine } from '../utils';
import { syncNotionSheets } from '../world/notion/sync';
import { SubFunc, WorldAPI } from '../world/world';

const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 -world <address> -categories <string> -action <string>  -args <number[]>')
  .alias('category', 'c')
  .option('sync-notion', {
    type: 'boolean',
    describe: 'Sync world CSVs from Notion before generating init calls',
    default: false,
  })
  .parse();

const run = async () => {
  if (argv['sync-notion'] || process.env.NOTION_SYNC === 'true') {
    console.log('Syncing world CSVs from Notion...');
    const results = await syncNotionSheets();
    console.log(`Synced ${results.length} sheet${results.length === 1 ? '' : 's'} from Notion.`);
  }

  // setup
  const world = argv.world ? argv.world : process.env.WORLD;
  const category: keyof WorldAPI = argv.category ?? 'init';
  const action = argv.action ? (argv.action as keyof SubFunc) : 'init';
  const args = argv.args
    ? argv.args
        .toString()
        .split(',') // ensure array
        .map((a: string) => Number(a)) // cast to number
    : undefined;
  const npcArgs = argv.npc
    ? argv.npc
        .toString()
        .split(',')
        .map((a: string) => Number(a))
    : undefined;

  setAutoMine(true);

  await genInitScript(category, action, args, npcArgs);
  await initWorld(world, argv.forge); // running script.sol

  setAutoMine(false);
};

run();

//////////////
// FORGE CALL

async function initWorld(worldAddress?: string, forge?: string) {
  const child = execa(
    'forge',
    [
      'script',
      'deployment/contracts/InitWorld.s.sol:InitWorld',
      '--broadcast',
      '--sig',
      'initWorld(uint256,address)',
      process.env.PRIV_KEY!,
      worldAddress || ethers.ZeroAddress, // World address (0 = deploy a new world)
      '--fork-url',
      process.env.RPC!,
      '--priority-gas-price=0',
      '--with-gas-price=0',
      '--skip',
      'test',
      ...ignoreSolcErrors,
      ...(forge?.toString().split(/,| /) || []),
    ],
    { stdio: ['inherit', 'pipe', 'pipe'] }
  );

  child.stderr?.on('data', (data) => console.log('stderr:', data.toString()));
  child.stdout?.on('data', (data) => console.log(data.toString()));

  console.log('---------------------------------------------\n');
  console.log('World state initialing ');
  console.log('\n---------------------------------------------');
  console.log('\n\n');

  return { child: await child };
}
