import { EntityIndex, Has, HasValue, QueryFragment, runQuery, World } from '@mud-classic/recs';

import { Components } from 'network/components';
import { getEntityByHash } from '../utils';

export interface Filters {
  index?: number;
  registry?: boolean;
}

// Query for a set of items (AND)
export const query = (components: Components, filters: Filters): EntityIndex[] => {
  const { EntityType, IsRegistry, ItemIndex } = components;

  const toQuery: QueryFragment[] = [];
  if (filters?.index) toQuery.push(HasValue(ItemIndex, { value: filters.index }));
  if (filters?.registry) toQuery.push(Has(IsRegistry));
  toQuery.push(HasValue(EntityType, { value: 'ITEM' }));

  return Array.from(runQuery(toQuery));
};

// get all the items in the registry
export const queryRegistry = (components: Components): EntityIndex[] => {
  return query(components, { registry: true });
};

// query for an item by its index, using the entity hash
export const queryByIndex = (world: World, index: number): EntityIndex | undefined => {
  return getEntityByHash(world, ['registry.item', index], ['string', 'uint32']);
};
