import { EntityID, EntityIndex, World, getComponentValue, hasComponent } from '@mud-classic/recs';

import { formatEntityID } from 'engine/utils';
import { Components } from 'network/';
import { getData } from 'network/shapes/utils/data';
import { numberToHex } from 'utils/hex';
import { getCurrPhase } from 'utils/time';
import { Account } from '../Account';
import { getReputation } from '../Faction';
import { getInventoryByHolderItem } from '../Inventory';
import { getItemBalance } from '../Item';
import { Kami, getKamiLocation, getKamisByAccount } from '../Kami';
import { hasCompletedQuest } from '../Quest';
import { queryRoomByIndex } from '../Room';
import { getHolderSkillLevel } from '../Skill';
import { getEntityType, getKamiOwnerID, getRoomIndex } from './component';
import { parseKamiStateToIndex } from './parse';

// TODO: clean this horrendous thing up
export const getBalance = (
  world: World,
  components: Components,
  holder: EntityIndex | undefined,
  index: number | undefined,
  type: string,
  isKami?: boolean
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
    return (getComponentValue(Level, holder)?.value ?? 0) * 1;
  } else if (type === 'BLOCKTIME') {
    return Date.now() / 1000;
  } else if (type === 'SKILL') {
    return getHolderSkillLevel(world, components, holderID, index ?? 0);
  }

  // account specific
  if (!isKami) {
    if (type === 'KAMI') {
      return getKamisByAccount(world, components, holderID, { progress: true }).length || 0;
    } else if (type === 'KAMI_LEVEL_HIGHEST') {
      let top = 0;
      getKamisByAccount(world, components, holderID, { progress: true }).forEach((kami) => {
        const level = kami.progress?.level ?? 0;
        if (level > top) top = level;
      });
      return top;
    } else if (type === 'KAMI_LEVEL_QUANTITY') {
      let total = 0;
      getKamisByAccount(world, components, holderID, { progress: true }).forEach((kami) => {
        const level = kami.progress?.level ?? 0;
        if (level >= (index ?? 0)) total++;
      });
      return total;
    } else if (type === 'ROOM') {
      return (getComponentValue(RoomIndex, holder)?.value ?? 0) * 1;
    }
  }

  return getData(world, components, holderID, type, index ?? 0);
};

export const getBool = (
  world: World,
  components: Components,
  holder: Account | Kami | undefined,
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

  // account specific, check if holder is account shaped
  if (holder.ObjectType === 'ACCOUNT') {
    holder = holder as Account;
    if (type === 'QUEST') {
      return hasCompletedQuest(components, index as number, holder);
    } else if (type === 'ROOM') {
      return holder.roomIndex == index;
    }
  }

  // kami specific, check if holder is kami shaped (nothing here rn)
  if (holder.ObjectType === 'KAMI') {
    holder = holder as Kami;
    if (type === 'STATE') {
      return index == parseKamiStateToIndex(holder.state);
    } else if (type === 'KAMI_CAN_EAT') {
      return holder.state === 'RESTING' || holder.state === 'HARVESTING';
    }
  }

  // if nothing else doesnt match, return false (should not reach here)
  return false;
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

// TODO: deprecate this completely
export const getInventoryBalance = (
  world: World,
  components: Components,
  account: Account,
  index: number
): number => {
  return getInventoryByHolderItem(world, components, account.id, index).balance ?? 0;
};
