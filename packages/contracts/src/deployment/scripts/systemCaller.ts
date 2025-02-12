import { ethers } from 'ethers';

import { ParamType } from '@ethersproject/abi';
import { SystemAbis } from '../world/mappings/SystemAbis';
import { idToSystem } from '../world/mappings/SystemMappings';

type Call = {
  system: string;
  id: string;
  args: string;
};

export const createCall = (
  systemID: keyof typeof SystemAbis,
  args: any[],
  encodedArgs: boolean,
  encodedTypes?: ParamType[]
): Call => {
  return {
    system: idToSystem[systemID],
    id: getSystemID(systemID).toString(10),
    args: encodedArgs ? encodeArgs(systemID, args, encodedTypes) : parseArgs(args).join(', '),
  };
};

export const encodeArgs = (
  system: keyof typeof SystemAbis,
  args: any[],
  encodedTypes?: ParamType[]
) => {
  const types = encodedTypes ?? getExecuteTyped(system); // uses executeTyped if no types provided
  return 'hex\\"' + ethers.utils.defaultAbiCoder.encode(types, args).slice(2) + '\\"';
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

const getExecuteTyped = (system: keyof typeof SystemAbis) => {
  const abi = getAbi(system).find(
    (abi: any) => abi.type === 'function' && abi.name === 'executeTyped'
  );
  if (!abi) throw new Error('No executeTyped function found');
  return abi.inputs.map((n: { type: any }) => n.type);
};
