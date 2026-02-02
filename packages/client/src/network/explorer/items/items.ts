import { EntityIndex, getEntitiesWithValue, World } from 'engine/recs';

import { Components } from 'network/';
import { getAllItems, getItem, getItemByIndex } from 'network/shapes/Item';
import { getWorldBalances } from './stats';

export const items = (world: World, comps: Components) => {
  const { EntityType } = comps;
  return {
    all: () => getAllItems(world, comps).sort((a, b) => a.index - b.index),
    get: (entity: EntityIndex) => getItem(world, comps, entity),
    getByIndex: (index: number) => getItemByIndex(world, comps, index),
    entities: () => Array.from(getEntitiesWithValue(EntityType, { value: 'ITEM' })),
    indices: () => [...new Set(Array.from(comps.ItemIndex.values.value.values()))],
    stats: {
      worldBalances: (index: number, limit = 200, flatten = false) => {
        return getWorldBalances(world, comps, index, limit, flatten);
      },
    },
  };
};
