import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  QueryFragment,
  World,
  runQuery,
} from '@mud-classic/recs';

import { Components } from 'network/';
import { getEntityByHash } from '../utils';

export interface Filters {
  holder?: EntityID;
  index?: number;
  registry?: boolean;
}

// Query for a set of skill with an AND filter
export const query = (components: Components, filters: Filters): EntityIndex[] => {
  const { EntityType, OwnsSkillID, IsRegistry, SkillIndex } = components;

  const toQuery: QueryFragment[] = [];
  if (filters?.holder) toQuery.push(HasValue(OwnsSkillID, { value: filters.holder }));
  if (filters?.index) toQuery.push(HasValue(SkillIndex, { value: filters.index }));
  if (filters?.registry) toQuery.push(Has(IsRegistry));
  toQuery.push(HasValue(EntityType, { value: 'SKILL' }));

  return Array.from(runQuery(toQuery));
};

// get all the skills in the registry
export const queryRegistry = (components: Components): EntityIndex[] => {
  return query(components, { registry: true });
};

export const queryForHolder = (components: Components, holder: EntityID): EntityIndex[] => {
  return query(components, { holder: holder });
};

// query a skill registry entity by index
export const queryByIndex = (
  world: World,
  components: Components,
  index: number
): EntityIndex | undefined => {
  let entity = getEntityByHash(world, ['registry.skill', index], ['string', 'uint32']);

  // query if the ID hash is not found
  if (!entity) {
    const results = query(components, { index: index, registry: true });
    if (results.length > 0) entity = results[0];
    if (results.length > 1) console.warn(`found more than one skill registry with index ${index}`);
  }
  return entity;
};
