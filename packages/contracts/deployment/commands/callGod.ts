const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
import dotenv from 'dotenv';
import execa from 'execa';
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

import { ignoreSolcErrors, setAutoMine } from '../utils';

const argv = yargs(hideBin(process.argv)).usage('Usage: $0 -world <address>').parse();

const run = async () => {
  // setup
  const world = argv.world ? argv.world : process.env.WORLD;

  setAutoMine(true);
  await executeGodSystem(world, argv.forge);
  setAutoMine(false);
};

/////////////
// FORGE CALL

const executeGodSystem = async (world: string, forge?: string) => {
  const child = execa(
    'forge',
    [
      'script',
      'deployment/contracts/GodSystem.s.sol:GodSystem',
      '--broadcast',
      '--fork-url',
      process.env.RPC!,
      '--priority-gas-price=0',
      '--with-gas-price=0',
      '--sig',
      'run(uint256,address)',
      process.env.PRIV_KEY!,
      world || '0x00',
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
};

/////////////
// RUN

run();
