import { EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { Harvest, getHarvest } from 'network/shapes/Harvest';
import {
  getLastTime,
  getResetTime,
  getStartTime,
  getState,
  getValue,
} from 'network/shapes/utils/component';
import { getKami } from '../kami';
import { getNode } from '../node';

export const HarvestCache = new Map<EntityIndex, Harvest>();
export const HarvestLastTs = new Map<EntityIndex, number>();
export const RateCache = new Map<EntityIndex, number>(); // harvest entity -> rate

// last updates of sub-objects
export const KamiUpdateTs = new Map<EntityIndex, number>();
export const NodeUpdateTs = new Map<EntityIndex, number>();

interface Options {
  live?: number;
  node?: number; // consider removing this as an option to flatten shape
  kami?: number; // consider removing this as an option to flatten shape
}
// get a harvest from the cache or poll the live data
export const get = (world: World, comps: Components, entity: EntityIndex, options?: Options) => {
  if (!HarvestLastTs.has(entity)) process(world, comps, entity);
  const harvest = HarvestCache.get(entity)!;
  if (!options) return harvest;

  const now = Date.now();

  // populate the live changing fields
  if (options.live != undefined) {
    const updateTs = HarvestLastTs.get(entity) ?? 0;
    const updateDelta = (now - updateTs) / 1000; // convert to seconds
    if (updateDelta > options.live) {
      harvest.balance = getValue(comps, entity);
      harvest.state = getState(comps, entity);
      harvest.time = {
        start: getStartTime(comps, entity),
        reset: getResetTime(comps, entity),
        last: getLastTime(comps, entity),
      };
    }
  }

  // populate the kami if requested
  if (options.kami != undefined) {
    const updateTs = KamiUpdateTs.get(entity) ?? 0;
    const updateDelta = (now - updateTs) / 1000; // convert to seconds
    if (updateDelta > options.kami) {
      harvest.kami = getKami(world, comps, entity, options);
      KamiUpdateTs.set(entity, now);
    }
  }

  // populate the node if requested
  if (options.node != undefined) {
    const updateTs = NodeUpdateTs.get(entity) ?? 0;
    const updateDelta = (now - updateTs) / 1000; // convert to seconds
    if (updateDelta > options.node) {
      harvest.node = getNode(world, comps, entity);
      NodeUpdateTs.set(entity, now);
    }
  }

  return harvest;
};

// retrieve a harvest's most recent data and update it on the cache
export const process = (world: World, comps: Components, entity: EntityIndex) => {
  const harvest = getHarvest(world, comps, entity);
  HarvestLastTs.set(entity, harvest.time.last);
  HarvestCache.set(entity, harvest);
  return harvest;
};
