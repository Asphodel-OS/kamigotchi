import { parse } from 'csv-parse/sync';
import { utils } from 'ethers';
// import { MUDJsonRpcProvider } from 'layers/network/workers/providers/provider';

// export function sleepIf() {
//   const urlParams = new URLSearchParams(window.location.search);
//   const mode = urlParams.get('mode') || import.meta.env.MODE;
//   if (mode && (mode == 'staging' || mode == 'production')) {
//     console.log('sleeping');
//     return new Promise((resolve) => setTimeout(resolve, 4000));
//   }
// }

// // temporary function to enable switch anvil modes for sending many transactions at one go
// // will not be needed when world.ts migrates to solidity
// export function setAutoMine(provider: MUDJsonRpcProvider, on: boolean) {
//   if (import.meta.env.MODE == 'development' || import.meta.env.MODE == undefined) {
//     provider.send(`${on ? 'evm_setAutomine' : 'evm_setIntervalMining'}`, [on ? true : 1]);
//   }
// }

// export function setTimestamp(provider: MUDJsonRpcProvider) {
//   if (import.meta.env.MODE == 'development' || import.meta.env.MODE == undefined) {
//     const timestamp = Math.floor(new Date().getTime() / 1000);
//     provider.send('evm_setNextBlockTimestamp', [timestamp]);
//   }
// }

export async function readFile(file: string) {
  const fs = require('fs');
  const path = require('path');
  const result = fs.readFileSync(path.join(__dirname, '../data/', file), 'utf8');
  return await parse(result, { columns: true });
}

// parses common human readable words into machine types
export const parseToLogicType = (str: string): string => {
  const is = ['IS', 'COMPLETE', 'AT'];
  const min = ['MIN', 'HAVE', 'GREATER'];
  const max = ['MAX', 'LESSER'];
  const equal = ['EQUAL'];
  const not = ['NOT'];

  if (is.includes(str)) return 'BOOL_IS';
  else if (min.includes(str)) return 'CURR_MIN';
  else if (max.includes(str)) return 'CURR_MAX';
  else if (equal.includes(str)) return 'CURR_EQUAL';
  else if (not.includes(str)) return 'BOOL_NOT';
  else {
    console.error('unrecognized logic type');
    return '';
  }
};

export const getGoalID = (index: number) => {
  return utils.solidityKeccak256(['string', 'uint32'], ['goal', index]);
};
