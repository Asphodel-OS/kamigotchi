const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
import dotenv from 'dotenv';
import { constants } from 'ethers';
import execa from 'execa';

import { genInitScript } from '../scripts/worldIniter';
import { getDeployerKey, getRpc, getWorld, ignoreSolcErrors, setAutoMine } from '../utils';
import { SubFunc, WorldAPI } from '../world/world';

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
  await genInitScript(mode, category, action, args);

  // running script.sol
  await initWorld(getDeployerKey(mode), getRpc(mode)!, world, argv.forgeOpts);

  if (mode === 'DEV') setAutoMine(false);
};

run();

//////////////
// FORGE CALL

async function initWorld(
  deployerPriv?: string,
  rpc = 'http://localhost:8545',
  worldAddress?: string,
  forgeOpts?: string
) {
  const child = execa(
    'forge',
    [
      'script',
      'src/deployment/contracts/InitWorld.s.sol:InitWorld',
      '--broadcast',
      '--sig',
      'initWorld(uint256,address)',
      deployerPriv || constants.AddressZero, // Deployer
      worldAddress || constants.AddressZero, // World address (0 = deploy a new world)
      '--fork-url',
      rpc,
      '--skip',
      'test',
      ...ignoreSolcErrors,
      ...(forgeOpts?.toString().split(/,| /) || []),
    ],
    { stdio: ['inherit', 'pipe', 'pipe'] }
  );

  child.stderr?.on('data', (data) => console.log('stderr:', data.toString()));
  child.stdout?.on('data', (data) => console.log(data.toString()));

  console.log('---------------------------------------------\n');
  console.log('World state initialing ');
  console.log('\n---------------------------------------------');
  console.log('\n\n');

  return { child: await child };
}
