import { ethers } from 'ethers';
import execa = require('execa');

import { SystemAbis } from '../../world/mappings/SystemAbis';
import { idToSystem } from '../../world/mappings/SystemMappings';

type Call = {
  system: string;
  id: string;
  args: string;
  world?: string;
};

export const executeCall = async (rpc: string, deployerKey: string, data: Call) => {
  const child = execa(
    'forge',
    [
      'script',
      'src/deployment/contracts/SystemCall.s.sol:SystemCall',
      '--broadcast',
      '--fork-url',
      rpc,
      '--sig',
      'call(uint256,address,uint256,bytes)',
      deployerKey,
      data.world || '0',
      data.system,
      data.args,
    ],
    { stdio: ['inherit', 'pipe', 'pipe'] }
  );
  child.stderr?.on('data', (data) => console.log('stderr:', data.toString()));
  child.stdout?.on('data', (data) => console.log(data.toString()));

  return { child: await child };
};

export const executeCallFromStream = async (rpc: string, deployerKey: string, world: string) => {
  const child = execa(
    'forge',
    [
      'script',
      'src/deployment/contracts/InitWorld.s.sol:InitWorld',
      '--broadcast',
      '--fork-url',
      rpc,
      '--sig',
      'initWorld(uint256,address)',
      deployerKey,
      world || '0x00',
    ],
    { stdio: ['inherit', 'pipe', 'pipe'] }
  );
  child.stderr?.on('data', (data) => console.log('stderr:', data.toString()));
  child.stdout?.on('data', (data) => console.log(data.toString()));

  return { child: await child };
};

export const executeGodSystem = async (rpc: string, deployerKey: string, world: string) => {
  const child = execa(
    'forge',
    [
      'script',
      'src/deployment/contracts/GodSystem.s.sol:GodSystem',
      '--broadcast',
      '--fork-url',
      rpc,
      '--sig',
      'run(uint256,address)',
      deployerKey,
      world || '0x00',
    ],
    { stdio: ['inherit', 'pipe', 'pipe'] }
  );
  child.stderr?.on('data', (data) => console.log('stderr:', data.toString()));
  child.stdout?.on('data', (data) => console.log(data.toString()));

  return { child: await child };
};

export const createCall = (
  systemID: keyof typeof SystemAbis,
  args: any[],
  typed?: boolean,
  world?: string
): Call => {
  return {
    system: idToSystem[systemID],
    id: getSystemID(systemID).toString(10),
    args: typed ? parseArgs(args).join(', ') : encodeArgs(systemID, args),
    world,
  };
};

export const encodeArgs = (system: keyof typeof SystemAbis, args: any[]) => {
  const abi = getAbi(system).find((abi) => abi.type === 'function' && abi.name === 'executeTyped');
  if (abi)
    return (
      'hex\\"' +
      ethers.utils.defaultAbiCoder
        .encode(
          abi.inputs.map((n: { type: any }) => n.type),
          args
        )
        .slice(2) +
      '\\"'
    );
  return '';
};

export const parseArgs = (args: any[]) => {
  return args.map((arg) => {
    if (typeof arg === 'string' && !arg.includes('[') && !arg.startsWith('0x'))
      // if string, and not array or starts with 0x
      return `\\"${arg}\\"`; // converting to string literal
    else return arg;
  });
};

/////////////////
// TYPE CONVERTERS

// @dev converts a number array to a literal solidity compatible array, as a string
// [uint32(1), 2, 3, 4, 5, 6, 7, 8]
export const toUint32FixedArrayLiteral = (arr: any[]): string => {
  const fixedArr = new Array(8);
  fixedArr.fill('0');
  fixedArr[0] = `uint32(${arr[0]})`;
  for (let i = 1; i < arr.length; i++) fixedArr[i] = arr[i];
  return `[${fixedArr.join(', ')}]`;
};

/////////////////
// GETTERS

const getSystemID = (system: string): bigint => {
  return BigInt(ethers.utils.id(system));
};

const getAbi = (system: keyof typeof SystemAbis) => {
  return SystemAbis[system];
};
