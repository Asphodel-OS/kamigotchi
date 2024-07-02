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
  .demandOption(['mode'])
  .parse();
dotenv.config();

const run = async () => {
  // setup
  const mode = argv.mode || 'DEV';
  const world = argv.world ? argv.world : getWorld(mode);
  const categories: (keyof WorldAPI)[] = argv.categories
    ? argv.categories.split(',').map((cat: string) => cat.trim() as keyof WorldAPI)
    : ['global'];
  const action = argv.action ? (argv.action as keyof SubFunc) : 'init';
  if (action !== 'init' && categories.length > 1)
    throw new Error('Only one category allowed for non-init actions');

  if (mode === 'DEV') setAutoMine(true);

  // generate init script and calls
  await generateInitScript(mode, categories, action, argv.args);

  // running script.sol
  await initWorld(getDeployerKey(mode), getRpc(mode)!, world);

  if (mode === 'DEV') setAutoMine(false);
};

run();
