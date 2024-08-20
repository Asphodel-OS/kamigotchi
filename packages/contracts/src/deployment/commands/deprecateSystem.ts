const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
import dotenv from 'dotenv';

import { deprecate } from './utils/deprecater';
import { getDeployerKey, getRpc, getWorld, setAutoMine } from './utils/utils';

const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 -mode <mode> -systems <address[]>')
  .demandOption(['mode', 'systems'])
  .parse();
dotenv.config();

const run = async () => {
  // setup
  const mode = argv.mode || 'DEV';
  const world = argv.world ? argv.world : getWorld(mode);
  const systems = argv.systems;

  if (mode === 'DEV') setAutoMine(true);

  // generate init script and calls
  await deprecate(systems, world, getDeployerKey(mode), getRpc(mode)!);

  if (mode === 'DEV') setAutoMine(false);
};

run();
