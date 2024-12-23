import { EntityIndex, getEntitiesWithValue, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { getAllItems, getItem, getItemByIndex } from 'network/shapes/Item';

export const items = (world: World, components: Components) => {
  const { EntityType } = components;
  return {
    all: () => getAllItems(world, components),
    get: (entity: EntityIndex) => getItem(world, components, entity),
    getByIndex: (index: number) => getItemByIndex(world, components, index),
    entities: () => Array.from(getEntitiesWithValue(EntityType, { value: 'ITEM' })),
    indices: () => [...new Set(Array.from(components.ItemIndex.values.value.values()))],
  };
};
