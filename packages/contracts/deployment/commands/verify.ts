const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
import dotenv from 'dotenv';
import execa from 'execa';
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

import { ignoreSolcErrors } from '../utils';

const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 -systems <strings | addresses> --byAddress <bool>')
  .parse();

const run = async () => {
  verifySystems();
};

run();

////////////
// FORGE CALL

export async function deprecateByAddress(systems: string, worldAddress: string, forge?: string) {
  const child = execa(
    'forge',
    [
      'script',
      'deployment/contracts/Deprecate.s.sol:Deprecate',
      '--broadcast',
      '--sig',
      'deprecateByAddress(uint256, address, address[])',
      process.env.PRIV_KEY!,
      worldAddress,
      systems, // Systems
      '--fork-url',
      process.env.RPC!,
      '--priority-gas-price=0',
      '--with-gas-price=0',
      '--skip',
      'test',
      ...ignoreSolcErrors,
      ...(forge?.toString().split(/,| /) || []),
    ],
    { stdio: ['inherit', 'pipe', 'pipe'] }
  );

  child.stderr?.on('data', (data) => console.log('stderr:', data.toString()));
  child.stdout?.on('data', (data) => console.log(data.toString()));

  return { child: await child };
}

export async function deprecateByID(systems: string, worldAddress: string, forge?: string) {
  const child = execa(
    'forge',
    [
      'script',
      'deployment/contracts/Deprecate.s.sol:Deprecate',
      '--broadcast',
      '--sig',
      'deprecateByID(uint256, address, string[])',
      process.env.PRIV_KEY!,
      worldAddress,
      systems,
      '--fork-url',
      process.env.RPC!,
      '--priority-gas-price=0',
      '--with-gas-price=0',
      '--skip',
      'test',
      ...ignoreSolcErrors,
      ...(forge?.toString().split(/,| /) || []),
    ],
    { stdio: ['inherit', 'pipe', 'pipe'] }
  );

  child.stderr?.on('data', (data) => console.log('stderr:', data.toString()));
  child.stdout?.on('data', (data) => console.log(data.toString()));

  return { child: await child };
}
