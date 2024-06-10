import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';

import { Components } from 'network/';
import { getCoinBal } from '../Inventory';
import { Kami, getKami } from '../Kami';
import { Node, getNode } from '../Node';
import { calcRate } from './functions';

// standardized shape of an Production Entity
export interface Production {
  id: EntityID;
  balance: number;
  rate: number;
  state: string;
  time: {
    last: number;
    reset: number;
    start: number;
  };
  node?: Node;
}

// optional data to populate for a Production Entity
export interface ProductionOptions {
  node?: boolean;
}

// get an Production from its EnityIndex
export const getProduction = (
  world: World,
  components: Components,
  index: EntityIndex,
  options?: ProductionOptions,
  kami?: Kami
): Production => {
  const { NodeID, PetID, State, LastTime, ResetTime, StartTime } = components;
  let production: Production = {
    id: world.entities[index],
    rate: 0,
    balance: getCoinBal(world, components, world.entities[index]),
    state: getComponentValue(State, index)?.value as string,
    time: {
      last: (getComponentValue(LastTime, index)?.value as number) * 1,
      reset: (getComponentValue(ResetTime, index)?.value as number) * 1,
      start: (getComponentValue(StartTime, index)?.value as number) * 1,
    },
  };

  /////////////////
  // OPTIONAL DATA

  // populate Node
  if (options?.node) {
    const nodeID = getComponentValue(NodeID, index)?.value as EntityID;
    const nodeIndex = world.entityToIndex.get(nodeID);
    if (nodeIndex) production.node = getNode(world, components, nodeIndex);
  }

  /////////////////
  // ADJUSTMENTS

  // retrieve the kami if it's not passed in
  // NOTE: rate calcs only work if the node is set
  if (!kami) {
    const kamiID = getComponentValue(PetID, index)?.value as EntityID;
    const kamiEntityIndex = world.entityToIndex.get(kamiID) ?? (0 as EntityIndex);
    kami = getKami(world, components, kamiEntityIndex, { account: true, traits: true });
  }
  production.rate = calcRate(production, kami);
  return production;
};
