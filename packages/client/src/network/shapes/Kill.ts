import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';

import { formatEntityID } from 'engine/utils';
import { Components } from 'network/';
import { getKamiName } from './Kami';
import { Node, getNode } from './Node';
import { getDataArray } from './utils';

// standardized Object shape of a Kill Entity
export interface Kill {
  id: EntityID;
  entityIndex: EntityIndex;
  source?: string; // source name
  target?: string; // target name
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
  const { NodeID, SourceID, TargetID, Time } = components;

  const id = world.entities[entityIndex];

  // populate the Node
  const nodeID = formatEntityID(getComponentValue(NodeID, entityIndex)?.value ?? '');
  const nodeEntityIndex = world.entityToIndex.get(nodeID) as EntityIndex;
  const node = getNode(world, components, nodeEntityIndex);
  const bounties = getDataArray(world, components, id, 'KILL_BOUNTIES');

  const killLog: Kill = {
    id: id,
    entityIndex,
    node,
    balance: bounties[0],
    bounty: bounties[1],
    time: (getComponentValue(Time, entityIndex)?.value as number) * 1,
  };

  /////////////////
  // OPTIONAL DATA

  // populate the source kami
  if (options?.source) {
    const sourceID = formatEntityID(getComponentValue(SourceID, entityIndex)?.value ?? '');
    const sourceEntityIndex = world.entityToIndex.get(sourceID) as EntityIndex;
    killLog.source = getKamiName(components, sourceEntityIndex);
  }

  // populate the target kami
  if (options?.target) {
    const targetID = formatEntityID(getComponentValue(TargetID, entityIndex)?.value ?? '');
    const targetEntityIndex = world.entityToIndex.get(targetID) as EntityIndex;
    killLog.target = getKamiName(components, targetEntityIndex);
  }

  return killLog;
};
