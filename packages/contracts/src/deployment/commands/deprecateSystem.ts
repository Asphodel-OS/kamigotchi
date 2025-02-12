const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
import dotenv from 'dotenv';
import { constants } from 'ethers';
import { ignoreSolcErrors } from '../utils';
import execa = require('execa');

import { getDeployerKey, getRpc, getWorld, setAutoMine } from '../utils';

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

////////////
// FORGE CALL

export async function deprecateByAddress(
  systems: string,
  worldAddress: string,
  deployerPriv?: string,
  rpc = 'http://localhost:8545',
  forgeOpts?: string
) {
  const child = execa(
    'forge',
    [
      'script',
      'src/deployment/contracts/Deprecate.s.sol:Deprecate',
      '--broadcast',
      '--sig',
      'deprecateByAddress(uint256, address, address[])',
      deployerPriv || constants.AddressZero, // Deployer priv
      worldAddress,
      systems, // Systems
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

  return { child: await child };
}

export async function deprecateByID(
  systems: string,
  worldAddress: string,
  deployerPriv?: string,
  rpc = 'http://localhost:8545',
  forgeOpts?: string
) {
  const child = execa(
    'forge',
    [
      'script',
      'src/deployment/contracts/Deprecate.s.sol:Deprecate',
      '--broadcast',
      '--sig',
      'deprecateByID(uint256, address, string[])',
      deployerPriv || constants.AddressZero, // Deployer priv
      worldAddress,
      systems, // Systems
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

  return { child: await child };
}
