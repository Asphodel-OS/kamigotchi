const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
import dotenv from 'dotenv';
const openurl = require('openurl');
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

import { clearInitWorld } from '../scripts/codegen';
import { generateAndDeploy } from '../scripts/deployer';
import { genInitScript } from '../scripts/worldIniter';
import { setAutoMine, setTimestamp } from '../utils';

const argv = yargs(hideBin(process.argv)).argv;

const run = async () => {
  const partialDeployment =
    argv.partial ??
    (argv.components != undefined || argv.systems != undefined || argv.emitter != undefined);
  const world = partialDeployment ? argv.world || process.env.WORLD : undefined;
  // assume world state init if deploying a fresh world, unless explicitly stated
  const init = !partialDeployment || !(argv.skipInit ?? true);

  setAutoMine(true);
  console.log(`** Deploying to ${process.env.NODE_ENV} **`);
  // generate or clear world init script based on args
  if (init) genInitScript('init', 'init');
  else clearInitWorld();

  const result = await generateAndDeploy({
    worldAddress: world,
    components: argv.components,
    systems: argv.systems,
    emitter: argv.emitter,
    initWorld: init,
    forge: argv.forge,
    reuseComponents: argv.reuseComps,
  });
  if (init) {
    openurl.open(
      'http://localhost:3000/?worldAddress=' +
        result.deployedWorldAddress +
        '&initialBlockNumber=' +
        result.startBlock
    );
  }

  await setAutoMine(false);
  if (init) await setTimestamp();
};

run();
