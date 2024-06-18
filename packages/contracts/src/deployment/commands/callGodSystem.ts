const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
import dotenv from 'dotenv';

import { executeGodSystem } from './utils/systemCaller';
import { getDeployerKey, getRpc, getWorld, setAutoMine } from './utils/utils';

const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 -mode <mode> -world <address>')
  .demandOption(['mode'])
  .parse();
dotenv.config();

const run = async () => {
  // setup
  const mode = argv.mode || 'DEV';
  const world = argv.world ? argv.world : getWorld(mode);

  await setAutoMine(mode, true);
  await executeGodSystem(getRpc(mode)!, getDeployerKey(mode)!, world);
  await setAutoMine(mode, false);
};

run();
