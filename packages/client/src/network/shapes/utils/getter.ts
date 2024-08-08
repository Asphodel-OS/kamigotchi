import { World, hasComponent } from '@mud-classic/recs';

import { formatEntityID } from 'engine/utils';
import { Components } from 'network/';
import { getData } from 'network/shapes/utils/data';
import { numberToHex } from 'utils/hex';
import { getCurrPhase } from 'utils/time';
import { Account } from '../Account';
import { getReputationValue } from '../Faction';
import { getInventoryByHolderItem } from '../Item';
import { Kami } from '../Kami';
import { hasCompletedQuest } from '../Quest';

export const getBalance = (
  world: World,
  components: Components,
  holder: Account | Kami,
  index: number | undefined,
  type: string
): number => {
  // universal gets - account and kami shape compatible
  if (type === 'SKILL') {
    const skill = holder.skills?.find((s) => s.index === index);
    return skill?.points.current || 0;
  } else if (type === 'REPUTATION') {
    return getReputationValue(world, components, holder.id, index ?? 0);
  } else if (type === 'LEVEL') {
    return holder.level;
  } else if (type === 'BLOCKTIME') {
    return Date.now() / 1000;
  }

  // account specific, check if holder is account shaped
  if ('kamis' in holder) {
    if (type === 'ITEM') {
      return getInventoryBalance(world, components, holder, index ?? 0);
    } else if (type === 'KAMI') {
      return holder.kamis?.length || 0;
    } else if (type === 'KAMI_LEVEL_HIGHEST') {
      let top = 0;
      holder.kamis?.forEach((kami) => {
        if (kami.level > top) top = kami.level;
      });
      return top;
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
    const rawEntityID = formatEntityID(numberToHex(value ?? 0));
    const entityIndex = world.entityToIndex.get(rawEntityID);
    return entityIndex !== undefined && hasComponent(IsComplete, entityIndex);
  } else if (type === 'PHASE') {
    return getCurrPhase() == index;
  }

  // account specific, check if holder is account shaped
  if ('kamis' in holder) {
    if (type === 'QUEST') {
      return hasCompletedQuest(world, components, index as number, holder);
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
