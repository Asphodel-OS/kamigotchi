import { EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { queryItemByIndex } from 'network/shapes/Item';
import { getItemIndex, getValue } from 'network/shapes/utils/component';
import { getItem } from '../item';

// mapping from an inventory entity to its item entity
const ITEM_CACHE = new Map<EntityIndex, EntityIndex>();

// get an inventory from its EnityIndex
// NOTE: inventory itself doesn't really need an explicit cache with only one direct field
export const get = (world: World, components: Components, entity: EntityIndex) => {
  if (!ITEM_CACHE.has(entity)) {
    const itemIndex = getItemIndex(components, entity);
    const itemEntity = queryItemByIndex(world, itemIndex);
    if (!!itemEntity) ITEM_CACHE.set(entity, itemEntity);
  }
  const itemEntity = ITEM_CACHE.get(entity) ?? (0 as EntityIndex);

  return {
    id: world.entities[entity],
    entityIndex: entity,
    balance: getValue(components, entity),
    item: getItem(world, components, itemEntity),
  };
};
