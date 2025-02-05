import { EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { Item, NullItem, getItem, queryItemByIndex } from 'network/shapes/Item';

// we don't expect item registry entities to change much
const ItemCache = new Map<EntityIndex, Item>(); // item entity -> item

// save the requested item entity to the cache
export const process = (world: World, components: Components, entity: EntityIndex): Item => {
  const item = getItem(world, components, entity);
  if (item.index != 0) ItemCache.set(entity, item);
  return item;
};

// get an item by its EnityIndex
export const get = (world: World, components: Components, entity: EntityIndex): Item => {
  if (!ItemCache.has(entity)) process(world, components, entity);
  return ItemCache.get(entity)!;
};

export const getByIndex = (world: World, components: Components, index: number): Item => {
  const entity = queryItemByIndex(world, index);
  if (!entity) return NullItem;
  return get(world, components, entity);
};
