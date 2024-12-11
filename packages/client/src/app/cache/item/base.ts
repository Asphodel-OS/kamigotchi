import { EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { Item, getItem } from 'network/shapes/Item';

// we don't expect item registry entities to change much
const ItemCache = new Map<EntityIndex, Item>(); // item entity -> item

// get an item by its EnityIndex
export const get = (world: World, components: Components, entity: EntityIndex): Item => {
  if (!ItemCache.has(entity)) process(world, components, entity);
  return ItemCache.get(entity)!;
};

// save the requested item entity to the cache
export const process = (world: World, components: Components, entity: EntityIndex): Item => {
  const item = getItem(world, components, entity);
  if (item.index != 0) ItemCache.set(entity, item);
  return item;
};
