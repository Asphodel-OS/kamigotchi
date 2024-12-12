import { EntityID, EntityIndex, HasValue, QueryFragment, runQuery, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { getEntityByHash } from '../utils';

// fields to filter by (only supports an AND of all fields)
export type QueryOptions = {
  account?: EntityID;
  index?: number;
  state?: string;
  name?: string;
};

// returns raw entity indices
export const query = (components: Components, options?: QueryOptions): EntityIndex[] => {
  const { EntityType, OwnsKamiID, Name, State, KamiIndex } = components;

  const toQuery: QueryFragment[] = [];
  if (options?.index != undefined) toQuery.push(HasValue(KamiIndex, { value: options.index }));
  if (options?.name != undefined) toQuery.push(HasValue(Name, { value: options.name }));
  if (options?.account != undefined) toQuery.push(HasValue(OwnsKamiID, { value: options.account }));
  if (options?.state != undefined) toQuery.push(HasValue(State, { value: options.state }));
  toQuery.push(HasValue(EntityType, { value: 'KAMI' }));

  const results = runQuery(toQuery);
  return Array.from(results);
};

// attempt to get a kami by its index through its deterministic id hash
// then attempt to get it through standard query
export function queryByIndex(
  world: World,
  comps: Components,
  index: number
): EntityIndex | undefined {
  const entity = getEntityByHash(world, ['kami.id', index], ['string', 'uint32']);
  if (entity) return entity;
  console.warn(`queryByIndex: kami ${index} not found by hash`);

  const results = query(comps, { index });
  if (results.length == 0) {
    console.warn(`queryByIndex: kami ${index} not found`);
    return undefined;
  }

  if (results.length > 1) console.warn(`queryByIndex: multiple kami ${index} found`);
  return results[0];
}

export const queryByState = (components: Components, state: string): EntityIndex[] => {
  return query(components, { state });
};
