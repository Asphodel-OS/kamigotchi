const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
import dotenv from 'dotenv';

import { deprecateByAddress, deprecateByID } from './utils/deprecater';
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
  const systems: string[] = argv.systems;
  const idType = argv.byAddress ? 'ADDRESS' : 'ID';

  console.log(systems);

  if (mode === 'DEV') setAutoMine(true);

  // generate init script and calls
  if (idType === 'ADDRESS')
    await deprecateByAddress(
      `[${systems}]`,
      world,
      getDeployerKey(mode),
      getRpc(mode)!,
      argv.forgeOpts
    );
  else
    await deprecateByID(`[${systems}]`, world, getDeployerKey(mode), getRpc(mode)!, argv.forgeOpts);

  if (mode === 'DEV') setAutoMine(false);
};

run();
