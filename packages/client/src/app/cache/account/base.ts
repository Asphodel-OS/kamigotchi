import { EntityID, EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { Account, getAccount, getAccountConfigs, NullAccount } from 'network/shapes/Account';
import { getBio } from 'network/shapes/Account/bio';
import { NameCache, OperatorCache, OwnerCache } from 'network/shapes/Account/queries';
import { getMusuBalance } from 'network/shapes/Item';
import { getStamina } from 'network/shapes/Stats';
import {
  getLastActionTime,
  getLastTime,
  getMediaURI,
  getRoomIndex,
} from 'network/shapes/utils/component';
import { getFriends, getInventories, getStats } from './getters';

// Account caches and Account cache checkers
export const AccountCache = new Map<EntityIndex, Account>(); // account entity -> account

export const LiveUpdateTs = new Map<EntityIndex, number>();
export const ConfigsUpdateTs = new Map<EntityIndex, number>();
export const FriendsUpdateTs = new Map<EntityIndex, number>();
export const InventoriesUpdateTs = new Map<EntityIndex, number>();
export const StatsUpdateTs = new Map<EntityIndex, number>();
export const PfpURITs = new Map<EntityIndex, number>();
export const BioUpdateTs = new Map<EntityIndex, number>();

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

export interface Options {
  bio?: number;
  live?: number;
  config?: number;
  friends?: number;
  inventory?: number;
  stats?: number;
  pfp?: number;

  // quests?: number; // TODO
  // kamis?: number; // TODO: figure out how best to populate subobjects
}

// get a account from its EnityIndex
export const get = (
  world: World,
  components: Components,
  entity: EntityIndex,
  options?: Options
) => {
  if (entity == 0) return NullAccount;
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
      acc.stamina = getStamina(components, entity);
      acc.time = {
        creation: acc?.time?.creation ?? 0,
        action: getLastActionTime(components, entity),
        last: getLastTime(components, entity),
      };
      LiveUpdateTs.set(entity, now);
    }
  }

  if (options.config !== undefined) {
    const updateTs = ConfigsUpdateTs.get(entity) ?? 0;
    const updateDelta = (now - updateTs) / 1000; // convert to seconds
    if (updateDelta > options.config) {
      acc.config = getAccountConfigs(world, components);
      ConfigsUpdateTs.set(entity, now);
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
  if (options.inventory !== undefined) {
    const updateTs = InventoriesUpdateTs.get(entity) ?? 0;
    const updateDelta = (now - updateTs) / 1000; // convert to seconds
    if (updateDelta > options.inventory) {
      acc.inventories = getInventories(world, components, entity);
      acc.coin = getMusuBalance(world, components, entity);
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

  if (options.pfp !== undefined) {
    const updateTs = PfpURITs.get(entity) ?? 0;
    const updateDelta = (now - updateTs) / 1000; // convert to seconds
    if (updateDelta > options.pfp) {
      acc.pfpURI = getMediaURI(components, entity);
      PfpURITs.set(entity, now);
    }
  }

  if (options.bio !== undefined) {
    const updateTs = BioUpdateTs.get(entity) ?? 0;
    const updateDelta = (now - updateTs) / 1000; // convert to seconds
    if (updateDelta > options.bio) {
      acc.bio = getBio(components, entity);
      BioUpdateTs.set(entity, now);
    }
  }
  return acc;
};

export const getByID = (world: World, components: Components, id: EntityID, options?: Options) => {
  const entity = world.entityToIndex.get(id);
  if (!entity) return NullAccount;
  return get(world, components, entity, options);
};
