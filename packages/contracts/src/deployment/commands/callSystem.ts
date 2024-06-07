const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
import dotenv from 'dotenv';
import { generateAbiMappings } from './utils/codegen';
import { getDeployerKey, getRpc, getWorld } from './utils/getConfig';
import { createCall, executeCall } from './utils/systemCaller';

const argv = yargs(hideBin(process.argv))
  .usage("Usage: $0 -genAbis <bool> -mode <mode> -system <system.id> -args <'arg1','arg2'>")
  .demandOption(['mode', 'system', 'args'])
  .parse();
dotenv.config();

const run = async () => {
  const mode = argv.mode || 'DEV';

  if (argv.genAbis) generateAbiMappings();

  const data = createCall(argv.system, argv.args.split(','), undefined, getWorld(mode));
  const result = await executeCall(getRpc(mode), getDeployerKey(mode), data);

  return result;
};

run();
