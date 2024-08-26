import { EntityIndex, World, getComponentValue, hasComponent } from '@mud-classic/recs';

import { formatEntityID } from 'engine/utils';
import { Components } from 'network/';
import { getData } from 'network/shapes/utils/data';
import { numberToHex } from 'utils/hex';
import { getCurrPhase } from 'utils/time';
import { Account } from '../Account';
import { getReputationValue } from '../Faction';
import { getInventoryByHolderItem, getItemBalance } from '../Item';
import { Kami, getKamisByAccount } from '../Kami';
import { hasCompletedQuest } from '../Quest';
import { getHolderSkillLevel } from '../Skill';

export const getBalance = (
  world: World,
  components: Components,
  holder: EntityIndex,
  index: number | undefined,
  type: string,
  isKami?: boolean
): number => {
  const { Level, RoomIndex } = components;
  const holderID = world.entities[holder];

  if (type === 'ITEM') {
    return getItemBalance(world, components, holderID, index ?? 0);
  } else if (type === 'REPUTATION') {
    return getReputationValue(world, components, holderID, index ?? 0);
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
      return getKamisByAccount(world, components, holderID).length || 0;
    } else if (type === 'KAMI_LEVEL_HIGHEST') {
      let top = 0;
      getKamisByAccount(world, components, holderID).forEach((kami) => {
        if (kami.level > top) top = kami.level;
      });
      return top;
    } else if (type === 'ROOM') {
      return (getComponentValue(RoomIndex, holder)?.value ?? 0) * 1;
    }
  }

  return getData(world, components, holderID, type, index ?? 0);
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
    const rawEntityID = formatEntityID(numberToHex(value ?? 0));
    const entityIndex = world.entityToIndex.get(rawEntityID);
    return entityIndex !== undefined && hasComponent(IsComplete, entityIndex);
  } else if (type === 'PHASE') {
    return getCurrPhase() == index;
  }

  // account specific, check if holder is account shaped
  if ('kamis' in holder) {
    if (type === 'QUEST') {
      return hasCompletedQuest(components, index as number, holder);
    } else if (type === 'ROOM') {
      return holder.roomIndex == index;
    }
  }

  // kami specific, check if holder is kami shaped (nothing here rn)
  if ('account' in holder) {
  }

  // if nothing else doesnt match, return false (should not reach here)
  return false;
};

export const getInventoryBalance = (
  world: World,
  components: Components,
  account: Account,
  index: number
): number => {
  return getInventoryByHolderItem(world, components, account.id, index).balance ?? 0;
};
