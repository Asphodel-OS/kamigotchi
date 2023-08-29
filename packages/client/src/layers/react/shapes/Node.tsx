import {
  EntityIndex,
  EntityID,
  getComponentValue,
} from '@latticexyz/recs';

import { Layers } from 'src/types';
import { Kami } from './Kami';

export interface NodeKamis {
  allies: Kami[];
  enemies: Kami[];
}

// standardized shape of a Node Entity
export interface Node {
  id: EntityID;
  index: number;
  entityIndex: EntityIndex;
  type: string;
  location: number;
  name: string;
  description: string;
  affinity?: string;
  kamis?: NodeKamis;
}

// get a Node from its EntityIndex
export const getNode = (
  layers: Layers,
  index: EntityIndex,
): Node => {
  const {
    network: {
      world,
      components: {
        Affinity,
        Description,
        Location,
        Name,
        NodeIndex,
        Type,
      },
    },
  } = layers;

  let node: Node = {
    id: world.entities[index],
    index: getComponentValue(NodeIndex, index)?.value as number * 1,
    entityIndex: index,
    type: getComponentValue(Type, index)?.value as string,
    location: getComponentValue(Location, index)?.value as number * 1,
    name: getComponentValue(Name, index)?.value as string,
    description: getComponentValue(Description, index)?.value as string,
    affinity: getComponentValue(Affinity, index)?.value as string, // does this break if there's no affinity?
  }

  return node;
}