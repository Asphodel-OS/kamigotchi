const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
import dotenv from 'dotenv';
const openurl = require('openurl');

import { clearInitWorld } from './utils/codegen';
import { generateAndDeploy } from './utils/deployer';
import { getDeployerKey, getRpc, getWorld, setAutoMine, setTimestamp } from './utils/utils';
import { generateInitScript } from './utils/worldIniter';

const argv = yargs(hideBin(process.argv)).argv;
dotenv.config();

const config = 'deploy.json';

const run = async () => {
  const mode = argv.mode || 'DEV';
  const partialDeployment = argv.components != undefined || argv.systems != undefined;
  const world = partialDeployment ? argv.world || getWorld(mode) : undefined;
  // assume world state init if deploying a fresh world, unless explicitly stated
  const init = !partialDeployment || !(argv.skipInit ?? true);

  if (mode === 'DEV') setAutoMine(true);

  // geneate or clear world init script based on args
  if (init) generateInitScript(mode, [], 'init');
  else clearInitWorld();

  const result = await generateAndDeploy({
    config: config,
    rpc: getRpc(mode)!,
    deployerPriv: getDeployerKey(mode)!,
    worldAddress: world,
    components: argv.components,
    systems: argv.systems,
    initWorld: init,
    forgeOpts: argv.forgeOpts,
  });

  openurl.open(
    'http://localhost:3000/?worldAddress=' +
      result.deployedWorldAddress +
      '&initialBlockNumber=' +
      result.startBlock
  );

  if (mode === 'DEV') await setAutoMine(false);
  if (mode === 'DEV') await setTimestamp();
};

run();
