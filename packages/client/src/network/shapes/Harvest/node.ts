import { EntityIndex, World, getComponentValue } from '@mud-classic/recs';

import { formatEntityID } from 'engine/utils';
import { Components } from 'network/';
import { getNode as getNodeShape } from '../Node';

// query the Node entity for a Harvest entity (field pull)
export const queryNode = (world: World, components: Components, entity: EntityIndex) => {
  const { SourceID } = components;
  const nodeID = formatEntityID(getComponentValue(SourceID, entity)?.value ?? '');
  return world.entityToIndex.get(nodeID);
};

// get the Node object of a Harvest entity
export const getNode = (world: World, components: Components, entity: EntityIndex) => {
  const nodeEntity = queryNode(world, components, entity);
  return getNodeShape(world, components, nodeEntity!);
};
