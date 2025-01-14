import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';

import { formatEntityID } from 'engine/utils';
import { Components } from 'network/';
import { getDataArray } from '../Data';
import { BaseKami, getBaseKami } from '../Kami';
import { BaseNode, getBaseNodeByIndex } from '../Node';

// standardized Object shape of a KillLog Entity
export interface KillLog {
  id: EntityID;
  entity: EntityIndex;
  source: BaseKami;
  target: BaseKami;
  node: BaseNode;
  balance: number;
  bounty: number;
  time: number;
}

// get a KillLog object from its EnityIndex
export const get = (world: World, components: Components, entity: EntityIndex): KillLog => {
  const { NodeIndex, SourceID, TargetID, Time } = components;

  const id = world.entities[entity];
  const bounties = getDataArray(world, components, id, 'KILL_BOUNTIES');

  // identify the Node
  const nodeIndex = (getComponentValue(NodeIndex, entity)?.value ?? 0) * 1;
  const node = getBaseNodeByIndex(world, components, nodeIndex); // update to bare

  // identify the Source and Target Kamis
  const sourceID = formatEntityID(getComponentValue(SourceID, entity)?.value ?? '');
  const targetID = formatEntityID(getComponentValue(TargetID, entity)?.value ?? '');
  const sourceEntity = world.entityToIndex.get(sourceID) as EntityIndex;
  const targetEntity = world.entityToIndex.get(targetID) as EntityIndex;

  const killLog: KillLog = {
    id,
    entity,
    node: node,
    balance: bounties[0],
    bounty: bounties[1],
    time: (getComponentValue(Time, entity)?.value as number) * 1,
    source: getBaseKami(world, components, sourceEntity),
    target: getBaseKami(world, components, targetEntity),
  };

  return killLog;
};
