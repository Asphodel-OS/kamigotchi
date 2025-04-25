const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
import dotenv from 'dotenv';
import execa from 'execa';
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

import { getAllSystemIDs, getSystemIDByName, ignoreSolcErrors, setAutoMine } from '../utils';

const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 -systems <strings | addresses> --byAddress <bool>')
  .parse();

const run = async () => {
  // setup
  const mode = argv.mode || 'DEV';
  const world = argv.world ? argv.world : process.env.WORLD;
  const systems: string[] = argv.systems ? argv.systems.split(',') : getAllSystemIDs();
  const addressMode = argv.byAddress || false; // either system name (default) or address

  // if system names are inputted, convert to IDs
  if (!addressMode) systems.map((sys, i) => (systems[i] = getSystemIDByName(sys)));

  console.log(systems);

  setAutoMine(true);

  // generate init script and calls
  if (addressMode === 'ADDRESS') await deprecateByAddress(`[${systems}]`, world, argv.forge);
  else await deprecateByID(`[${systems}]`, world, argv.forge);

  setAutoMine(false);
};

run();

////////////
// FORGE CALL

export async function deprecateByAddress(systems: string, worldAddress: string, forge?: string) {
  const child = execa(
    'forge',
    [
      'script',
      'deployment/contracts/Deprecate.s.sol:Deprecate',
      '--broadcast',
      '--sig',
      'deprecateByAddress(uint256, address, address[])',
      process.env.PRIV_KEY!,
      worldAddress,
      systems, // Systems
      '--fork-url',
      process.env.RPC!,
      '--with-gas-price',
      '0',
      '--skip',
      'test',
      ...ignoreSolcErrors,
      ...(forge?.toString().split(/,| /) || []),
    ],
    { stdio: ['inherit', 'pipe', 'pipe'] }
  );

  child.stderr?.on('data', (data) => console.log('stderr:', data.toString()));
  child.stdout?.on('data', (data) => console.log(data.toString()));

  return { child: await child };
}

export async function deprecateByID(systems: string, worldAddress: string, forge?: string) {
  const child = execa(
    'forge',
    [
      'script',
      'deployment/contracts/Deprecate.s.sol:Deprecate',
      '--broadcast',
      '--sig',
      'deprecateByID(uint256, address, string[])',
      process.env.PRIV_KEY!,
      worldAddress,
      systems,
      '--fork-url',
      process.env.RPC!,
      '--with-gas-price',
      '0',
      '--skip',
      'test',
      ...ignoreSolcErrors,
      ...(forge?.toString().split(/,| /) || []),
    ],
    { stdio: ['inherit', 'pipe', 'pipe'] }
  );

  child.stderr?.on('data', (data) => console.log('stderr:', data.toString()));
  child.stdout?.on('data', (data) => console.log(data.toString()));

  return { child: await child };
}
