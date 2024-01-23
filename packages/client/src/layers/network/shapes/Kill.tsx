import {
  EntityID,
  EntityIndex,
  getComponentValue,
} from '@latticexyz/recs';

import { Layers } from 'src/types';
import { Kami, getKami } from './Kami';
import { Node, getNode } from './Node';

// standardized Object shape of a Kill Entity
export interface Kill {
  id: EntityID;
  entityIndex: EntityIndex;
  source?: Kami;
  target?: Kami;
  node: Node;
  balance: number;
  bounty: number;
  time: number;
}

interface Options {
  source?: boolean;
  target?: boolean;
}

// get a Kill object from its EnityIndex
export const getKill = (
  layers: Layers,
  index: EntityIndex,
  options?: Options,
): Kill => {
  const {
    network: {
      components: {
        NodeID,
        SourceID,
        TargetID,
        Balance,
        Coin,
        Time,
      },
      world,
    },
  } = layers;

  // populate the Node
  const nodeID = getComponentValue(NodeID, index)?.value as EntityID;
  const nodeEntityIndex = world.entityToIndex.get(nodeID) as EntityIndex;
  const node = getNode(layers, nodeEntityIndex);

  const killLog: Kill = {
    id: world.entities[index],
    entityIndex: index,
    node,
    balance: (getComponentValue(Balance, index)?.value as number) * 1,
    bounty: (getComponentValue(Coin, index)?.value as number) * 1,
    time: (getComponentValue(Time, index)?.value as number) * 1,
  };

  /////////////////
  // OPTIONAL DATA

  // populate the source kami
  if (options?.source) {
    const sourceID = getComponentValue(SourceID, index)?.value as EntityID;
    const sourceEntityIndex = world.entityToIndex.get(sourceID) as EntityIndex;
    killLog.source = getKami(layers, sourceEntityIndex);
  }

  // populate the target kami
  if (options?.target) {
    const targetID = getComponentValue(TargetID, index)?.value as EntityID;
    const targetEntityIndex = world.entityToIndex.get(targetID) as EntityIndex;
    killLog.target = getKami(layers, targetEntityIndex);
  }

  return killLog;
}