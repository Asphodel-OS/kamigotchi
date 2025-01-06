import { EntityID, EntityIndex, World, getComponentValue, hasComponent } from '@mud-classic/recs';

import { formatEntityID } from 'engine/utils';
import { Components } from 'network/';
import { getData } from 'network/shapes/utils/data';
import { numberToHex } from 'utils/hex';
import { getCurrPhase } from 'utils/time';
import { Account, queryAccountKamis } from '../Account';
import { getReputation } from '../Faction';
import { hasFlag } from '../Flag';
import { getInventoryByHolderItem } from '../Inventory';
import { getItemBalance } from '../Item';
import { getKamiLocation } from '../Kami';
import { hasCompletedQuest } from '../Quest';
import { queryRoomByIndex } from '../Room';
import { getHolderSkillLevel } from '../Skill';
import { getEntityType, getKamiOwnerID, getLevel, getRoomIndex, getState } from './component';
import { parseKamiStateToIndex } from './parse';

// TODO: clean this horrendous thing up
export const getBalance = (
  world: World,
  components: Components,
  holder: EntityIndex | undefined,
  index: number | undefined,
  type: string
): number => {
  if (!holder) return 0;

  const { Level, RoomIndex } = components;
  let holderID = world.entities[holder];

  if (type.includes('GLOBAL')) {
    holderID = '0x0000000000000000000000000000000000000000' as EntityID;
  }

  if (type === 'ITEM') {
    return getItemBalance(world, components, holderID, index ?? 0);
  } else if (type === 'REPUTATION') {
    return getReputation(world, components, holderID, index ?? 0);
  } else if (type === 'LEVEL') {
    return getLevel(components, holder);
  } else if (type === 'BLOCKTIME') {
    return Date.now() / 1000;
  } else if (type === 'SKILL') {
    return getHolderSkillLevel(world, components, holderID, index ?? 0);
  } else if (type === 'ROOM') {
    return (getComponentValue(RoomIndex, holder)?.value ?? 0) * 1;
  } else if (type === 'KAMI') {
    // get quantity of kamis owned by account (todo: more descriptive)
    return queryAccountKamis(world, components, holder).length || 0;
  } else if (type === 'KAMI_LEVEL_HIGHEST') {
    const kamis = queryAccountKamis(world, components, holder);
    return getTopLevel(components, kamis);
  } else if (type === 'KAMI_LEVEL_QUANTITY') {
    const kamis = queryAccountKamis(world, components, holder);
    return getNumAboveLevel(components, kamis, index ?? 0);
  }

  return getData(world, components, holderID, type, index ?? 0);
};

export const getBool = (
  world: World,
  components: Components,
  holder: EntityIndex | undefined,
  index: number | undefined,
  value: number | undefined,
  type: string
): boolean => {
  const { IsComplete } = components;

  // universal gets - account and kami shape compatible
  if (type === 'COMPLETE_COMP') {
    // converted
    const rawEntityID = formatEntityID(numberToHex(value ?? 0));
    const entity = world.entityToIndex.get(rawEntityID);
    return entity !== undefined && hasComponent(IsComplete, entity);
  } else if (type === 'PHASE') {
    return getCurrPhase() == index;
  }

  if (!holder) return false;

  if (type === 'QUEST') {
    return hasCompletedQuest(world, components, index as number, holder);
  } else if (type === 'ROOM') {
    // note: does not support kami shapes. might need to implement kami handler
    return getRoomIndex(components, holder) == index;
  } else if (type === 'STATE') {
    // only supports kami state. need to implement if state checks are used elsewhere
    return index == parseKamiStateToIndex(getState(components, holder));
  } else if (type === 'KAMI_CAN_EAT') {
    // hardcoded.. until we have an OR condition that supports accepting RESTING or HARVESTING
    const state = getState(components, holder);
    return state === 'RESTING' || state === 'HARVESTING';
  }

  // check for flag if nothing else matches
  return hasFlag(world, components, holder, type);
};

///////////////////
// SPECIFIC GETTERS

export const getAccountFrom = (
  world: World,
  components: Components,
  entity: EntityIndex
): EntityIndex | undefined => {
  const shape = getEntityType(components, entity);
  if (shape === 'ACCOUNT')
    return entity; // already account
  else if (shape === 'KAMI') return world.entityToIndex.get(getKamiOwnerID(components, entity));
  else console.warn('getAccountFrom: invalid entity shape (no acc)');
};

export const getRoomFrom = (
  world: World,
  components: Components,
  entity: EntityIndex
): EntityIndex | undefined => {
  const shape = getEntityType(components, entity);

  let index = 0;
  if (shape === 'ACCOUNT') index = getRoomIndex(components, entity);
  else if (shape === 'KAMI') index = getKamiLocation(world, components, entity) ?? 0;

  return index == 0 ? undefined : queryRoomByIndex(components, index);
};

///////////////
// UTILS

const getTopLevel = (components: Components, entities: EntityIndex[]): number => {
  let highestLevel = 0;
  entities.forEach((entity) => {
    const level = getLevel(components, entity);
    if (level > highestLevel) highestLevel = level;
  });
  return highestLevel;
};

// gets number of entities above a certain level
const getNumAboveLevel = (
  components: Components,
  entities: EntityIndex[],
  level: number
): number => {
  let total = 0;
  entities.forEach((entity) => {
    const currLevel = getLevel(components, entity);
    if (currLevel >= level) total++;
  });
  return total;
};

// TODO: deprecate this completely
export const getInventoryBalance = (
  world: World,
  components: Components,
  account: Account,
  index: number
): number => {
  return getInventoryByHolderItem(world, components, account.id, index).balance ?? 0;
};
