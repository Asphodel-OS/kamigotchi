const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
import dotenv from 'dotenv';
import execa from 'execa';

import { getDeployerKey, getRpc, getWorld, ignoreSolcErrors, setAutoMine } from '../utils';

const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 -mode <mode> -world <address>')
  .demandOption(['mode'])
  .parse();
dotenv.config();

const run = async () => {
  // setup
  const mode = argv.mode || 'DEV';
  const world = argv.world ? argv.world : getWorld(mode);

  if (mode === 'DEV') setAutoMine(true);
  await executeGodSystem(getRpc(mode)!, getDeployerKey(mode)!, world, argv.forgeOpts);
  if (mode === 'DEV') setAutoMine(false);
};

/////////////
// FORGE CALL

const executeGodSystem = async (
  rpc: string,
  deployerKey: string,
  world: string,
  forgeOpts?: string
) => {
  const child = execa(
    'forge',
    [
      'script',
      'deployment/contracts/GodSystem.s.sol:GodSystem',
      '--broadcast',
      '--fork-url',
      rpc,
      '--sig',
      'run(uint256,address)',
      deployerKey,
      world || '0x00',
      '--skip',
      'test',
      ...ignoreSolcErrors,
      ...(forgeOpts?.toString().split(/,| /) || []),
    ],
    { stdio: ['inherit', 'pipe', 'pipe'] }
  );
  child.stderr?.on('data', (data) => console.log('stderr:', data.toString()));
  child.stdout?.on('data', (data) => console.log(data.toString()));

  return { child: await child };
};

/////////////
// RUN

run();
