import { constants } from 'ethers';
import { ignoreSolcErrors } from './utils';
import execa = require('execa');

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
      ...(forgeOpts?.split(' ') || []),
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
      ...(forgeOpts?.split(' ') || []),
    ],
    { stdio: ['inherit', 'pipe', 'pipe'] }
  );

  child.stderr?.on('data', (data) => console.log('stderr:', data.toString()));
  child.stdout?.on('data', (data) => console.log(data.toString()));

  return { child: await child };
}
