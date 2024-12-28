const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
import dotenv from 'dotenv';

import { SubFunc, WorldAPI } from '../world/world';
import { getDeployerKey, getRpc, getWorld, setAutoMine } from './utils/utils';
import { generateInitScript, initWorld } from './utils/worldIniter';

const argv = yargs(hideBin(process.argv))
  .usage(
    'Usage: $0 -mode <mode> -world <address> -categories <string | string[]> -action <string>  -args <number[]>'
  )
  .alias('category', 'c')
  .demandOption(['mode'])
  .parse();
dotenv.config();

const run = async () => {
  // setup
  const mode = argv.mode || 'DEV';
  const world = argv.world ? argv.world : getWorld(mode);
  const category: keyof WorldAPI = argv.category ?? 'init';
  const action = argv.action ? (argv.action as keyof SubFunc) : 'init';
  const args = argv.args
    ? argv.args
        .toString()
        .split(',') // ensure array
        .map((a: string) => Number(a)) // cast to number
    : undefined;

  if (mode === 'DEV') setAutoMine(true);

  // generate init script and calls
  await generateInitScript(mode, category, action, args);

  // running script.sol
  await initWorld(getDeployerKey(mode), getRpc(mode)!, world, argv.forgeOpts);

  if (mode === 'DEV') setAutoMine(false);
};

run();
