const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
import dotenv from 'dotenv';
const openurl = require('openurl');

import { clearInitWorld } from '../scripts/codegen';
import { generateAndDeploy } from '../scripts/deployer';
import { genInitScript } from '../scripts/worldIniter';
import { getDeployerKey, getMultisig, getRpc, getWorld, setAutoMine, setTimestamp } from '../utils';

const argv = yargs(hideBin(process.argv)).argv;
dotenv.config();

const run = async () => {
  const mode = argv.mode || 'DEV';
  const partialDeployment =
    argv.partial ??
    (argv.components != undefined || argv.systems != undefined || argv.emitter != undefined);
  const multisig = argv.multisig ?? getMultisig(mode);
  const world = partialDeployment ? argv.world || getWorld(mode) : undefined;
  // assume world state init if deploying a fresh world, unless explicitly stated
  const init = !partialDeployment || !(argv.skipInit ?? true);

  if (mode === 'DEV') setAutoMine(true);
  console.log(`** Deploying to ${mode} **`);
  // generate or clear world init script based on args
  if (init) genInitScript(mode, 'init', 'init');
  else clearInitWorld();

  const result = await generateAndDeploy({
    rpc: getRpc(mode)!,
    deployerPriv: getDeployerKey(mode)!,
    worldAddress: world,
    components: argv.components,
    systems: argv.systems,
    emitter: argv.emitter,
    initWorld: init,
    forgeOpts: argv.forgeOpts,
    mode: argv.mode,
    reuseComponents: argv.reuseComps,
    multisig: multisig,
  });
  if (init) {
    openurl.open(
      'http://localhost:3000/?worldAddress=' +
        result.deployedWorldAddress +
        '&initialBlockNumber=' +
        result.startBlock
    );
  }

  if (mode === 'DEV') await setAutoMine(false);
  if (mode === 'DEV' && init) await setTimestamp();
};

run();
