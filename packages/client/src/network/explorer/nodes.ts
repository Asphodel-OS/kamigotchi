import { EntityIndex, getEntitiesWithValue, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { getAllNodes, getNode, getNodeByIndex } from 'network/shapes/Node';

export const nodes = (world: World, components: Components) => {
  const { EntityType } = components;
  return {
    all: () => getAllNodes(world, components),
    get: (entity: EntityIndex) => getNode(world, components, entity),
    getByIndex: (index: number) => getNodeByIndex(world, components, index),
    entities: () => Array.from(getEntitiesWithValue(EntityType, { value: 'NODE' })),
    indices: () => Array.from(components.NodeIndex.values.value.values()),
  };
};
