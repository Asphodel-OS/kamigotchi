const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
import dotenv from 'dotenv';
import execa from 'execa';
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

import {
  getCompIDByName,
  getDeployComponents,
  getDeploySystems,
  getSystemIDByName,
  WorldAddresses,
} from '../utils';
import { filterDeployConfigByEnv } from '../utils/deploy';
import { componentsDir, systemsDir } from '../utils/paths';

export async function verifySystems() {
  const World = new WorldAddresses();
  await World.init();

  const rawSystems = getDeploySystems();
  const filteredSystems = filterDeployConfigByEnv(rawSystems);
  const systems = filteredSystems.systems.map((sys: any) => sys.name);
  for (let i = 0; i < systems.length; i++) {
    const name = systems[i];
    verify(World, getSystemIDByName(name), name, true);
  }
}

verifySystems();

export async function verifyComponents() {
  const World = new WorldAddresses();
  await World.init();

  const components = getDeployComponents().components.map((comp) => comp.comp);
  for (let i = 0; i < components.length; i++) {
    const name = components[i];
    // console.log(name, await World.getCompAddr(await getCompIDByName(name)));
    verify(World, getCompIDByName(name), name, false);
  }
}

async function verify(World: WorldAddresses, id: string, name: string, isSystem: boolean) {
  if (!isSystem) name = `${name}Component`;
  console.log(`Verifying ${name}`);

  const args = isSystem
    ? `$(cast abi-encode "constructor(address, address)" "${World.worldAddr}" "${World.components}")`
    : `$(cast abi-encode "constructor(address, uint256)" "${World.worldAddr}" "${id}")`;
  const address = isSystem ? await World.getSysAddr(id) : await World.getCompAddr(id);
  const path = `${isSystem ? systemsDir : componentsDir}${name}.sol:${name}`;

  try {
    const child = forgeCall(args, address!, path);
    // child.stderr?.on('data', (data) => console.log('stderr:', data.toString()));
    // child.stdout?.on('data', (data) => console.log(data.toString()));

    const lines = (await child).stdout;
    if (lines.includes('Pass - Verified')) {
      console.log('Verified', name);
    } else {
      console.log('Verification failed for', name);
    }
  } catch (e) {
    console.log('Build failed for', name);
    // console.log(e);
  }
}

function forgeCall(args: string, address: string, path: string) {
  return execa(
    'forge',
    [
      'verify-contract',
      '--rpc-url',
      process.env.RPC!,
      '--verifier',
      'custom',
      '--verifier-url',
      'https://verification.alleslabs.dev/evm/verification/solidity/external/yominet-1',
      '--constructor-args',
      args,
      '--watch',
      address,
      path,
    ],
    { stdio: ['inherit', 'pipe', 'pipe'] }
  );
}
