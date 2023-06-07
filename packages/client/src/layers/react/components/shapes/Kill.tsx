import {
  EntityID,
  EntityIndex,
  getComponentValue,
} from '@latticexyz/recs';

import { Layers } from 'src/types';
import { Kami, getKami } from './Kami';
import { Node, getNode } from './Node';
import { get } from 'mobx';

// standardized Object shape of a Kill Entity
export interface Kill {
  id: EntityID;
  entityIndex: EntityIndex;
  source: Kami;
  target: Kami;
  node: Node;
  time: number;
}

// get a Kill object from its EnityIndex
export const getKill = (layers: Layers, index: EntityIndex): Kill => {
  const {
    network: {
      components: {
        NodeID,
        SourceID,
        TargetID,
        Time,
      },
      world,
    },
  } = layers;

  // populate the source kami
  const sourceID = getComponentValue(SourceID, index)?.value as EntityID;
  const sourceEntityIndex = world.entityToIndex.get(sourceID) as EntityIndex;
  const source = getKami(layers, sourceEntityIndex);

  // populate the target kami
  const targetID = getComponentValue(TargetID, index)?.value as EntityID;
  const targetEntityIndex = world.entityToIndex.get(targetID) as EntityIndex;
  const target = getKami(layers, targetEntityIndex);

  // populate the Node
  const nodeID = getComponentValue(NodeID, index)?.value as EntityID;
  const nodeEntityIndex = world.entityToIndex.get(nodeID) as EntityIndex;
  const node = getNode(layers, nodeEntityIndex);

  return {
    id: world.entities[index],
    entityIndex: index,
    source,
    target,
    node,
    time: getComponentValue(Time, index)?.value as number * 1,
  };
}