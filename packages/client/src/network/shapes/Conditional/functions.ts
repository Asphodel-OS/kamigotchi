import { World } from '@mud-classic/recs';

import { MUSU_INDEX } from 'constants/items';
import { Components } from 'network/';
import { getBalance, getBool } from 'network/shapes/utils';
import { Account } from '../Account';
import { Kami } from '../Kami';
import { Condition, HANDLER, OPERATOR, Status, Target } from './types';

////////////
// CHECKS

export const passesConditions = (
  world: World,
  components: Components,
  conditions: Condition[],
  holder: Account | Kami
): boolean => {
  if (conditions.length == 0) return true;
  return checkConditions(world, components, conditions, holder).every(
    (val: Status) => val.completable
  );
};

export const passesConditionsByFor = (
  world: World,
  components: Components,
  conditions: Condition[]
): boolean => {
  if (conditions.length == 0) return true;
  return checkConditionsByFor(world, components, conditions).every(
    (val: Status) => val.completable
  );
};

export const checkConditions = (
  world: World,
  components: Components,
  conditions: Condition[],
  holder: Account | Kami
): Status[] => {
  return conditions.map((condition) => checkCondition(world, components, condition, holder));
};

export const checkConditionsByFor = (
  world: World,
  components: Components,
  conditions: Condition[]
): Status[] => {
  const conds = splitCondByFor(conditions);
  const result: Status[] = [];

  // todo: fix with appropriate node checks
  // if (holders.account)
  //   result.push(...checkConditions(world, components, conds.get('ACCOUNT') ?? [], holders.account));
  // if (holders.kami)
  //   result.push(...checkConditions(world, components, conds.get('KAMI') ?? [], holders.kami));

  return result;
};

export const checkCondition = (
  world: World,
  components: Components,
  condition: Condition,
  holder: Account | Kami
): Status => {
  return checkerSwitch(
    condition.logic,
    checkCurrent(world, components, condition.target, holder),
    undefined,
    undefined,
    checkBoolean(world, components, condition.target, holder),
    { completable: false }
  );
};

export const checkCurrent = (
  world: World,
  components: Components,
  target: Target,
  holder: Account | Kami
): ((opt: any) => Status) => {
  return (opt: any) => {
    const accVal = getBalance(world, components, holder.entity, target.index, target.type) || 0;
    return {
      target: target.value,
      current: accVal,
      completable: checkLogicOperator(accVal, target.value ?? 0, opt),
    };
  };
};

export const checkBoolean = (
  world: World,
  components: Components,
  target: Target,
  holder: Account | Kami
): ((opt: any) => Status) => {
  return (opt: any) => {
    const result = getBool(world, components, holder, target.index, target.value, target.type);
    return {
      completable: opt === 'IS' ? result : !result,
    };
  };
};

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

//////////////
// PARSERS

// splits an array of conditions into entities its for
// @dev calling func expected to handle For types
export const splitCondByFor = (
  conds: Condition[],
  fallbackType?: string
): Map<string, Condition[]> => {
  const result = new Map<string, Condition[]>();
  const fallback = fallbackType ?? '';

  for (let i = 0; i < conds.length; i++) {
    const forEntity = conds[i].for ?? fallback;
    if (!result.has(forEntity)) result.set(forEntity, []);
    result.get(forEntity)!.push(conds[i]);
  }

  return result;
};

// parses common human readable conditions into machine types for init
export const parseToInitCon = (
  logicType: string,
  type: string,
  index: number,
  value: number
): { logicType: string; type: string; index: number; value: number } => {
  return {
    logicType: logicType == '' ? '' : parseToLogicType(logicType),
    type: parseToConType(type),
    index: parseToConIndex(type, index),
    value: value,
  };
};

// parses common human readable words into machine types. Assumes current.
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
  // coins are items now
  return str.replace('COIN', 'ITEM');
};

const parseToConIndex = (type: string, index: number): number => {
  // coins are items, use MUSU index
  if (type.includes('COIN')) return MUSU_INDEX;
  else return index;
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
