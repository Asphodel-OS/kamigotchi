// import {
//   EntityID,
//   EntityIndex,
//   Has,
//   HasValue,
//   Not,
//   QueryFragment,
//   getComponentValue,
//   hasComponent,
//   runQuery,
// } from '@mud-classic/recs';

// import { NetworkLayer } from 'layers/network/types';
// import { Account } from './Account';
// import { getData } from './Data';
// import { getInventoryByIndex } from './Inventory';

/**
 * A client equivalent to LibBoolean. For supporting other shapes
 */

export type HANDLER = 'CURR' | 'INC' | 'DEC' | 'BOOL';
export type OPERATOR = 'MIN' | 'MAX' | 'EQUAL' | 'IS' | 'NOT';

export const checkerSwitch = (
  logic: string,
  curr: (opt: OPERATOR) => any,
  inc?: (opt: OPERATOR) => any,
  dec?: (opt: OPERATOR) => any,
  bool?: (opt: OPERATOR) => any,
  uponFailure?: any
): any => {
  const [hdl, opt] = splitLogic(logic);
  if (hdl == 'CURR') return curr(opt as OPERATOR);
  else if (inc && hdl == 'INC') return inc(opt as OPERATOR);
  else if (dec && hdl == 'DEC') return dec(opt as OPERATOR);
  else if (bool && hdl == 'BOOL') return bool(opt as OPERATOR);
  else console.warn('LibBool: unknown handler');

  if (uponFailure) return uponFailure;
  else return curr('MIN');
};

export const checkLogicOperator = (
  a: number,
  b: number,
  logic: 'MIN' | 'MAX' | 'EQUAL' | 'IS' | 'NOT'
): boolean => {
  if (logic == 'MIN') return a >= b;
  else if (logic == 'MAX') return a <= b;
  else if (logic == 'EQUAL') return a == b;
  else return false; // should not reach here
};

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

/////////////////////////
// SMALL UTILS

const splitLogic = (str: string): [HANDLER | string, OPERATOR | string] => {
  const [hdl, opt] = str.split('_');
  return [hdl, opt];
};

const combineLogic = (hdl: HANDLER | string, opt: OPERATOR | string): string => {
  return `${hdl}_${opt}`;
};
