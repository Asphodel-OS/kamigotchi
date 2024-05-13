import { EntityID, EntityIndex, World, getComponentValue, hasComponent } from '@mud-classic/recs';

import { Components } from 'layers/network';
import { Account } from '../Account';
import { getData } from '../Data';
import { getInventoryByIndex } from '../Inventory';
import { Kami } from '../Kami';
import { hasCompletedQuest } from '../Quest';

/**
 * A client equivalent to Conditionals. For supporting other shapes
 */

export interface Condition {
  id: EntityID;
  logic: string;
  target: Target;
  status?: Status;
}

// the Target of a Condition (eg Objective, Requirement, Reward)
export interface Target {
  type: string;
  index?: number;
  value?: number;
}

export interface Status {
  target?: number;
  current?: number;
  completable: boolean;
}

export type HANDLER = 'CURR' | 'INC' | 'DEC' | 'BOOL';
export type OPERATOR = 'MIN' | 'MAX' | 'EQUAL' | 'IS' | 'NOT';

export const getCondition = (
  world: World,
  components: Components,
  entityIndex: EntityIndex | undefined
): Condition => {
  const { Balance, Index, LogicType, Type } = components;

  if (!entityIndex)
    return { id: '0' as EntityID, logic: '', target: { type: '' }, status: undefined };

  return {
    id: world.entities[entityIndex],
    logic: getComponentValue(LogicType, entityIndex)?.value || ('' as string),
    target: {
      type: getComponentValue(Type, entityIndex)?.value || ('' as string),
      index: getComponentValue(Index, entityIndex)?.value,
      value: getComponentValue(Balance, entityIndex)?.value,
    },
  };
};

///////////////////
// CHECKERS

export const passesConditions = (
  world: World,
  components: Components,
  conditions: Condition[],
  holder: Account | Kami
): boolean => {
  return checkConditions(world, components, conditions, holder).every(
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
  const accVal = getBalance(world, components, holder, target.index, target.type) || 0;

  return (opt: any) => {
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
  const result = getBool(world, components, holder, target.index, target.value, target.type);

  return (opt: any) => {
    return {
      completable: opt === 'IS' ? result : !result,
    };
  };
};

///////////////////
// GETTERS

export const getBalance = (
  world: World,
  components: Components,
  holder: Account | Kami,
  index: number | undefined,
  type: string
): number => {
  // universal gets - account and kami shape compatible
  if (type === 'COIN') {
    return getData(world, components, holder.id, 'COIN_TOTAL', 0) || 0;
  } else if (type === 'SKILL') {
    const skill = holder.skills?.find((s) => s.index === index);
    return skill?.points.current || 0;
  }

  // account specific, check if holder is account shaped
  if ('kamis' in holder) {
    if (type === 'ITEM') {
      return getInventoryBalance(holder, index, type);
    } else if (type === 'COIN') {
      return getData(world, components, holder.id, 'COIN_TOTAL', 0) || 0;
    } else if (type === 'KAMI') {
      return holder.kamis?.length || 0;
    } else if (type === 'KAMI_LEVEL_HIGHEST') {
      let top = 0;
      holder.kamis?.forEach((kami) => {
        if (kami.level > top) top = kami.level;
      });
    } else if (type === 'ROOM') {
      return holder.roomIndex || 0;
    }
  }

  // kami specific, check if holder is kami shaped (nothing here rn)
  if ('account' in holder) {
  }

  // if everything else doesnt match, get from dataEntity (returns 0 if not found)
  return getData(world, components, holder.id, type, index ?? 0);
};

export const getBool = (
  world: World,
  components: Components,
  holder: Account | Kami,
  index: number | undefined,
  value: number | undefined,
  type: string
): boolean => {
  const { IsComplete } = components;

  // universal gets - account and kami shape compatible
  if (type === 'COMPLETE_COMP') {
    // converted
    const rawEntityID = ('0x' + BigInt(value ?? 0).toString(16)) as EntityID; // force value to entityID
    const entityIndex = world.entityToIndex.get(rawEntityID);
    return entityIndex !== undefined && hasComponent(IsComplete, entityIndex);
  }

  // account specific, check if holder is account shaped
  if ('kamis' in holder) {
    if (type === 'QUEST') {
      return hasCompletedQuest(world, components, index as number, holder);
    } else if (type === 'ROOM') {
      return holder.roomIndex == value;
    }
  }

  // kami specific, check if holder is kami shaped (nothing here rn)
  if ('account' in holder) {
  }

  // if nothing else doesnt match, return false (should not reach here)
  return false;
};

const getInventoryBalance = (account: Account, index: number | undefined, type: string): number => {
  if (index === undefined) return 0; // should not reach here
  if (account.inventories === undefined) return 0; // should not reach here

  let balance = 0;
  switch (type) {
    case 'EQUIP':
      balance = getInventoryByIndex(account.inventories.gear, index)?.balance || 0;
    case 'FOOD':
      balance = getInventoryByIndex(account.inventories.food, index)?.balance || 0;
    case 'MOD':
      balance = getInventoryByIndex(account.inventories.mods, index)?.balance || 0;
    case 'REVIVE':
      balance = getInventoryByIndex(account.inventories.revives, index)?.balance || 0;
    default:
      balance = 0; // should not reach here
  }

  return Number(balance);
};

//////////////
// UTILS

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
