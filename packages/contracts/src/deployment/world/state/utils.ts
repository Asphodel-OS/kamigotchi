import { parse } from 'csv-parse/sync';
import { BigNumberish, utils } from 'ethers';

////////////////
// CONSTANTS

export const MUSU_INDEX = 1;

///////////////
// GETTERS

export const getGoalID = (index: number) => {
  return utils.solidityKeccak256(['string', 'uint32'], ['goal', index]);
};

///////////////
// PROCESSORS

// parses common human readable conditions into machine types for init
export const parseToInitCon = (
  logicType: string,
  type: string,
  index: number,
  value: BigNumberish
): { logicType: string; type: string; index: number; value: BigNumberish } => {
  return {
    logicType: logicType == '' ? '' : parseToLogicType(logicType),
    type: parseToConType(type),
    index: parseToConIndex(type, index),
    value: parseToConValue(type, index, value),
  };
};

///////////////
// MISC

export async function readFile(file: string) {
  const fs = require('fs');
  const path = require('path');
  const result = fs.readFileSync(path.join(__dirname, '../data/', file), 'utf8');
  return await parse(result, { columns: true });
}

///////////////
// INTERNAL

// parses common human readable words into machine types
const parseToLogicType = (str: string): string => {
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

const parseToConType = (str: string): string => {
  if (str === 'GOAL') return 'COMPLETE_COMP';
  else return str.replace('COIN', 'ITEM');
};

const parseToConIndex = (type: string, index: number): number => {
  // coins are items, use MUSU index
  if (type.includes('COIN')) return MUSU_INDEX;
  else if (type === 'GOAL') return 0;
  else return index;
};

const parseToConValue = (type: string, index: number, value: BigNumberish): BigNumberish => {
  if (type === 'GOAL') return getGoalID(index);
  else return value;
};
