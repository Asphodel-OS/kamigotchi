import { Has, HasValue, World, runQuery } from '@mud-classic/recs';

import { Components } from 'network/components';
import { DetailedEntity } from '../utils';
import { NullItem } from './constants';
import { queryByIndex } from './queries';
import { Item, getItem, getItemDetails } from './types';

/**
 * get an item in the registry by index
 * @param world - the world object
 * @param components - the list (as object) of registered components in the world
 * @param index - the item index of the registry instance
 */

export const getByIndex = (world: World, components: Components, index: number): Item => {
  const entity = queryByIndex(world, index);
  return entity ? getItem(world, components, entity) : NullItem;
};

export const getDetailsByIndex = (
  world: World,
  components: Components,
  index: number
): DetailedEntity => {
  const entity = queryByIndex(world, index);
  return entity ? getItemDetails(components, entity) : NullItem;
};

// get all items in the registry
export const getAll = (world: World, components: Components): Item[] => {
  const { IsRegistry, EntityType } = components;
  const entityIndices = Array.from(
    runQuery([Has(IsRegistry), HasValue(EntityType, { value: 'ITEM' })])
  );
  return entityIndices.map((entity) => getItem(world, components, entity));
};
