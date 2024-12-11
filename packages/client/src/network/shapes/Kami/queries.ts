import { EntityID, EntityIndex, HasValue, QueryFragment, runQuery } from '@mud-classic/recs';

import { Components } from 'network/';

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
  if (options?.index) toQuery.push(HasValue(KamiIndex, { value: options.index }));
  if (options?.name) toQuery.push(HasValue(Name, { value: options.name }));
  if (options?.account) toQuery.push(HasValue(OwnsKamiID, { value: options.account }));
  if (options?.state) toQuery.push(HasValue(State, { value: options.state }));
  toQuery.push(HasValue(EntityType, { value: 'KAMI' }));

  const results = runQuery(toQuery);
  return Array.from(results);
};

export const queryByName = (components: Components, name: string): EntityIndex => {
  const results = query(components, { name });
  if (results.length == 0) {
    console.warn(`no kami entity found for name ${name} `);
    return 0 as EntityIndex;
  }
  return results[0];
};

export const queryByState = (components: Components, state: string): EntityIndex[] => {
  return query(components, { state });
};
