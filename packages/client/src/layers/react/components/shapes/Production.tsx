import {
  EntityIndex,
  EntityID,
  getComponentValue,
} from '@latticexyz/recs';

import { Layers } from 'src/types';
import { Kami, getKami } from './Kami';
import { Node, getNode } from './Node';

// standardized shape of an Production Entity
export interface Production {
  id: EntityID;
  rate: number;
  state: string;
  startTime: number;
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
  layers: Layers,
  index: EntityIndex,
  options?: ProductionOptions
): Production => {
  const {
    network: {
      world,
      components: {
        NodeID,
        PetID,
        Rate,
        State,
        StartTime,
      },
    },
  } = layers;

  let production: Production = {
    id: world.entities[index],
    rate: getComponentValue(Rate, index)?.value as number,
    state: getComponentValue(State, index)?.value as string,
    startTime: getComponentValue(StartTime, index)?.value as number,
  };

  /////////////////
  // OPTIONAL DATA

  if (!options) return production;

  // populate Kami
  if (options.kami) {
    const kamiID = getComponentValue(PetID, index)?.value as EntityID;
    const kamiIndex = world.entityToIndex.get(kamiID);
    if (kamiIndex) production.kami = getKami(layers, kamiIndex, { account: true, stats: true });
  }

  // populate Node
  if (options.node) {
    const nodeID = getComponentValue(NodeID, index)?.value as EntityID;
    const nodeIndex = world.entityToIndex.get(nodeID);
    if (nodeIndex) production.node = getNode(layers, nodeIndex);
  }

  return production;
}
