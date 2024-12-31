import { EntityIndex, HasValue, runQuery, World } from '@mud-classic/recs';

import { Components } from 'network/components';
import { getEntityByHash } from '../utils';

export const IndexCache = new Map<number, EntityIndex>(); // index -> entity
export const NameCache = new Map<string, EntityIndex>(); // name -> entity

interface QueryOptions {
  index?: number;
  name?: string;
}

export const query = (comps: Components, options?: QueryOptions) => {
  const { EntityType, Name, NPCIndex } = comps;
  const query = [];
  if (options?.index) query.push(HasValue(NPCIndex, { value: options.index }));
  if (options?.name) query.push(HasValue(Name, { value: options.name }));
  query.push(HasValue(EntityType, { value: 'NPC' }));
  return Array.from(runQuery(query));
};

// attempt to get an NPC by its deterministic hash first, query if it fails
export const queryByIndex = (world: World, comps: Components, index: number) => {
  if (IndexCache.has(index)) return IndexCache.get(index)!;
  let entity = getEntityByHash(world, ['NPC', index], ['string', 'uint32']);
  if (!entity) {
    console.warn(`NPC ${index} not found through hash`);
    const results = query(comps, { index });
    if (results.length == 0) console.warn(`NPC ${index} not found through query`);
    else entity = results[0];
  }
  return entity;
};

export const queryByName = (comps: Components, name: string) => {
  if (NameCache.has(name)) return NameCache.get(name)!;
  return query(comps, { name })[0];
};
