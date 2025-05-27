import { EntityID, EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { getKami, Kami } from '../Kami';
import { Node } from '../Node';
import { getBalance, getLastTime, getResetTime, getStartTime, getState } from '../utils/component';
import { getNode } from './node';

// standardized shape of an Harvest Entity
export interface Harvest {
  id: EntityID;
  entity: EntityIndex;
  balance: number;
  state: string;
  rates: HarvestRates;
  time: {
    last: number;
    reset: number;
    start: number;
  };
  kami?: Kami;
  node?: Node;
}

interface HarvestRates {
  fertility: number;
  intensity: RateDetails;
  total: RateDetails;
}

export interface RateDetails {
  average: number;
  spot: number;
}

// optional data to populate for a Harvest Entity
export interface HarvestOptions {
  kami?: boolean;
  node?: boolean;
}

// get an Harvest from its EnityIndex
export const getHarvest = (
  world: World,
  components: Components,
  entity: EntityIndex,
  options?: HarvestOptions
): Harvest => {
  let harvest: Harvest = {
    id: world.entities[entity],
    entity,
    state: getState(components, entity),
    balance: getBalance(components, entity, false),
    time: {
      last: getLastTime(components, entity),
      reset: getResetTime(components, entity),
      start: getStartTime(components, entity),
    },
    // rates are interpreted from harvest/kami/node data
    rates: {
      fertility: 0,
      intensity: {
        average: 0,
        spot: 0,
      },
      total: {
        average: 0,
        spot: 0,
      },
    },
  };

  if (options?.kami) harvest.kami = getKami(world, components, entity);
  if (options?.node) harvest.node = getNode(world, components, entity);
  return harvest;
};
