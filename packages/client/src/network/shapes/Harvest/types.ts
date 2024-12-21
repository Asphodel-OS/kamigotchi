import { EntityID, EntityIndex, getComponentValue, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { getKami, Kami } from '../Kami';
import { Node } from '../Node';
import { getNode } from './node';

// standardized shape of an Harvest Entity
export interface Harvest {
  id: EntityID;
  entity: EntityIndex;
  balance: number;
  rate: number;
  state: string;
  time: {
    last: number;
    reset: number;
    start: number;
  };
  kami?: Kami;
  node?: Node;
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
  const { State, LastTime, ResetTime, StartTime, Value } = components;
  let harvest: Harvest = {
    id: world.entities[entity],
    entity,
    rate: 0,
    balance: ((getComponentValue(Value, entity)?.value as number) || 0) * 1,
    state: getComponentValue(State, entity)?.value as string,
    time: {
      last: (getComponentValue(LastTime, entity)?.value as number) * 1,
      reset: (getComponentValue(ResetTime, entity)?.value as number) * 1,
      start: (getComponentValue(StartTime, entity)?.value as number) * 1,
    },
  };

  if (options?.kami) harvest.kami = getKami(world, components, entity);
  if (options?.node) harvest.node = getNode(world, components, entity);
  return harvest;
};
