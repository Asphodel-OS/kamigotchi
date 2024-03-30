import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';

import { Components } from 'layers/network';
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
  world: World,
  components: Components,
  entityIndex: EntityIndex,
  options?: Options
): Kill => {
  const { NodeID, SourceID, TargetID, Balance, Coin, Time } = components;

  // populate the Node
  const nodeID = getComponentValue(NodeID, entityIndex)?.value as EntityID;
  const nodeEntityIndex = world.entityToIndex.get(nodeID) as EntityIndex;
  const node = getNode(world, components, nodeEntityIndex);

  const killLog: Kill = {
    id: world.entities[entityIndex],
    entityIndex,
    node,
    balance: (getComponentValue(Balance, entityIndex)?.value as number) * 1,
    bounty: (getComponentValue(Coin, entityIndex)?.value as number) * 1,
    time: (getComponentValue(Time, entityIndex)?.value as number) * 1,
  };

  /////////////////
  // OPTIONAL DATA

  // populate the source kami
  if (options?.source) {
    const sourceID = getComponentValue(SourceID, entityIndex)?.value as EntityID;
    const sourceEntityIndex = world.entityToIndex.get(sourceID) as EntityIndex;
    killLog.source = getKami(world, components, sourceEntityIndex);
  }

  // populate the target kami
  if (options?.target) {
    const targetID = getComponentValue(TargetID, entityIndex)?.value as EntityID;
    const targetEntityIndex = world.entityToIndex.get(targetID) as EntityIndex;
    killLog.target = getKami(world, components, targetEntityIndex);
  }

  return killLog;
};
