const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
import dotenv from 'dotenv';
const openurl = require('openurl');

import { generateAndDeploy } from './utils/deployer';
import { getDeployerKey, getRpc, getWorld, setAutoMine, setTimestamp } from './utils/utils';
import { generateInitScript, initWorld } from './utils/worldIniter';

const argv = yargs(hideBin(process.argv)).argv;
dotenv.config();

const config = 'deploy.json';

const run = async () => {
  const mode = argv.mode || 'DEV';
  const world =
    argv.components != undefined || argv.systems != undefined
      ? argv.world != undefined
        ? argv.world
        : getWorld(mode)
      : undefined;

  await setAutoMine(mode, true);

  // todo: separate generate files, put them into one chunk
  if (argv.init) {
    // generate init script
    generateInitScript(mode, [], 'init');
  }

  const result = await generateAndDeploy({
    config: config,
    rpc: getRpc(mode)!,
    deployerPriv: getDeployerKey(mode)!,
    worldAddress: world,
    components: argv.components,
    systems: argv.systems,
    forgeOpts: argv.forgeOpts,
  });

  // world state
  if (argv.init) {
    await initWorld(
      getDeployerKey(mode)!,
      getRpc(mode)!,
      result.deployedWorldAddress!,
      argv.forgeOpts
    );

    console.log('---------------------------------------------\n');
    console.log('World state initialized ');
    console.log('\n---------------------------------------------');
  }

  openurl.open(
    'http://localhost:3000/?worldAddress=' +
      result.deployedWorldAddress +
      '&initialBlockNumber=' +
      result.startBlock
  );

  await setAutoMine(mode, false);
  await setTimestamp(mode);
};

run();
