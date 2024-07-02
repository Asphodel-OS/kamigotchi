const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
import dotenv from 'dotenv';

import { getDeployerKey, getRpc, getWorld, setAutoMine } from './utils/utils';
import { generateSingleCall, initWorld } from './utils/worldIniter';

const argv = yargs(hideBin(process.argv))
  .usage(
    "Usage: $0 -mode <mode> -world <address> -func <string> -system <system.id>  -args <'arg1','arg2'>"
  )
  .demandOption(['mode', 'system'])
  .parse();
dotenv.config();

const run = async () => {
  // setup
  const mode = argv.mode || 'DEV';
  const world = argv.world ? argv.world : getWorld(mode);
  const system = argv.system;
  const func = argv.func ? argv.func : 'executeTyped';
  const args = argv.args ? argv.args.split(',') : [];

  if (mode === 'DEV') setAutoMine(true);

  // generate init script and calls
  await generateSingleCall(mode, system, func, args);

  // running script.sol
  await initWorld(getDeployerKey(mode), getRpc(mode)!, world);

  if (mode === 'DEV') setAutoMine(false);
};

run();
