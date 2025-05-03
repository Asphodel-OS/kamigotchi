import { EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/components';
import { getSourceID } from 'network/shapes/utils/component';
import { getNode } from '../node';

// get the Node object for a Harvest entity
export const getHarvestNode = (world: World, comps: Components, entity: EntityIndex) => {
  const nodeID = getSourceID(comps, entity);
  const nodeEntity = world.entityToIndex.get(nodeID) as EntityIndex;
  if (!nodeEntity) console.warn(`node not found for harvest entity ${entity}`);
  return getNode(world, comps, nodeEntity);
};
