import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';

import { Components } from 'layers/network';
import { getConfigFieldValue } from '../Config';
import { Kami, getKami } from '../Kami';
import { Node, getNode } from '../Node';

// standardized shape of an Production Entity
export interface Production {
  id: EntityID;
  balance: number;
  rate: number;
  state: string;
  time: {
    last: number;
    start: number;
  };
  kami?: Kami;
  node?: Node;
}

// optional data to populate for a Production Entity
export interface ProductionOptions {
  kami?: boolean;
  node?: boolean;
}

// get an Production from its EnityIndex
export const getProduction = (
  world: World,
  components: Components,
  index: EntityIndex,
  options?: ProductionOptions
): Production => {
  const { Coin, NodeID, PetID, LastTime, Rate, State, StartTime } = components;

  let production: Production = {
    id: world.entities[index],
    balance: ((getComponentValue(Coin, index)?.value as number) ?? 0) * 1,
    rate: getComponentValue(Rate, index)?.value as number,
    state: getComponentValue(State, index)?.value as string,
    time: {
      last: (getComponentValue(LastTime, index)?.value as number) * 1,
      start: (getComponentValue(StartTime, index)?.value as number) * 1,
    },
  };

  /////////////////
  // OPTIONAL DATA

  if (!options) return production;

  // populate Kami
  if (options.kami) {
    const kamiID = getComponentValue(PetID, index)?.value as EntityID;
    const kamiEntityIndex = world.entityToIndex.get(kamiID);
    if (kamiEntityIndex)
      production.kami = getKami(world, components, kamiEntityIndex, { account: true });
  }

  // populate Node
  if (options.node) {
    const nodeID = getComponentValue(NodeID, index)?.value as EntityID;
    const nodeIndex = world.entityToIndex.get(nodeID);
    if (nodeIndex) production.node = getNode(world, components, nodeIndex);
  }

  /////////////////
  // ADJUSTMENTS

  const ratePrecision = 10 ** getConfigFieldValue(components, 'HARVEST_RATE_PREC');
  production.rate /= ratePrecision;

  return production;
};
