import { EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { Account, getAccount, NullAccount } from 'network/shapes/Account';
import { NameCache, OperatorCache, OwnerCache } from 'network/shapes/Account/queries';
import { getLastActionTime, getLastTime, getRoomIndex } from 'network/shapes/utils/component';
import { getFriends, getInventories, getStats } from './getters';

// Account caches and Account cache checkers
export const AccountCache = new Map<EntityIndex, Account>(); // account entity -> account

export const LiveUpdateTs = new Map<EntityIndex, number>();
export const FriendsUpdateTs = new Map<EntityIndex, number>();
export const InventoriesUpdateTs = new Map<EntityIndex, number>();
export const StatsUpdateTs = new Map<EntityIndex, number>();

interface Options {
  live?: number;
  inventories?: number;
  friends?: number;
  stats?: number;
}

// get a account from its EnityIndex
export const get = (
  world: World,
  components: Components,
  entity: EntityIndex,
  options?: Options
) => {
  if (!AccountCache.has(entity)) process(world, components, entity);
  const acc = AccountCache.get(entity) ?? NullAccount;
  if (acc.index == 0 || !options) return acc;

  const now = Date.now();

  // TODO: add stamina here
  // populate the live changing fields as requested
  if (options.live !== undefined) {
    const updateTs = LiveUpdateTs.get(entity) ?? 0;
    const updateDelta = (now - updateTs) / 1000; // convert to seconds
    if (updateDelta > options.live) {
      acc.roomIndex = getRoomIndex(components, entity);
      acc.time = {
        creation: acc?.time?.creation ?? 0,
        action: getLastActionTime(components, entity),
        last: getLastTime(components, entity),
      };
      LiveUpdateTs.set(entity, now);
    }
  }

  // populate the friends as requested
  if (options.friends !== undefined) {
    const updateTs = FriendsUpdateTs.get(entity) ?? 0;
    const updateDelta = (now - updateTs) / 1000; // convert to seconds
    if (updateDelta > options.friends) {
      acc.friends = getFriends(world, components, entity);
      FriendsUpdateTs.set(entity, now);
    }
  }

  // populate the inventories as requested
  if (options.inventories !== undefined) {
    const updateTs = InventoriesUpdateTs.get(entity) ?? 0;
    const updateDelta = (now - updateTs) / 1000; // convert to seconds
    if (updateDelta > options.inventories) {
      acc.inventories = getInventories(world, components, entity);
      InventoriesUpdateTs.set(entity, now);
    }
  }

  if (options.stats !== undefined) {
    const updateTs = StatsUpdateTs.get(entity) ?? 0;
    const updateDelta = (now - updateTs) / 1000; // convert to seconds
    if (updateDelta > options.stats) {
      acc.stats = getStats(world, components, entity);
      StatsUpdateTs.set(entity, now);
    }
  }

  return acc;
};

// retrieve an acc's most recent data and update it on the cache
export const process = (world: World, components: Components, entity: EntityIndex) => {
  const acc = getAccount(world, components, entity);
  if (acc.index != 0) {
    AccountCache.set(entity, acc);
    NameCache.set(acc.name, entity);
    OperatorCache.set(acc.operatorAddress, entity);
    OwnerCache.set(acc.ownerAddress, entity);
  }
  return acc || NullAccount;
};
