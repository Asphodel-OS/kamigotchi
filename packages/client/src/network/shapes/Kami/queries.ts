import { EntityID, EntityIndex, HasValue, QueryFragment, World, runQuery } from '@mud-classic/recs';

import { Components } from 'network/';
import { Kami, Options as KamiOptions, getKami } from './types';

// fields to filter by (only supports an AND of all fields)
export type QueryOptions = {
  account?: EntityID;
  index?: number;
  state?: string;
};

// returns raw entity indices
export const query = (components: Components, options?: QueryOptions): EntityIndex[] => {
  const { EntityType, OwnsKamiID, State, KamiIndex } = components;

  const toQuery: QueryFragment[] = [];
  if (options?.index) toQuery.push(HasValue(KamiIndex, { value: options.index }));
  if (options?.account) toQuery.push(HasValue(OwnsKamiID, { value: options.account }));
  if (options?.state) toQuery.push(HasValue(State, { value: options.state }));
  toQuery.push(HasValue(EntityType, { value: 'KAMI' }));

  return Array.from(runQuery(toQuery));
};

export const queryAll = (components: Components): EntityIndex[] => {
  return query(components);
};

export const queryByIndex = (components: Components, index: number): EntityIndex[] => {
  return query(components, { index });
};

// query for all Kami entities owned by an Account based on its ID
export const queryByAccount = (components: Components, accountID: EntityID): EntityIndex[] => {
  return query(components, { account: accountID });
};

export const queryByState = (components: Components, state: string): EntityIndex[] => {
  return query(components, { state });
};

// not included in query options - not used in regular game, skip for performance
export const queryByName = (components: Components, name: string): EntityIndex[] => {
  const { Name, EntityType } = components;

  const toQuery: QueryFragment[] = [
    HasValue(Name, { value: name }),
    HasValue(EntityType, { value: 'KAMI' }),
  ];
  return Array.from(runQuery(toQuery));
};

//////////////////
// INTERNAL

export const getLazyKamis = (
  world: World,
  components: Components
): ((queryOpts: QueryOptions, options?: KamiOptions) => Array<() => Kami>) => {
  return (queryOpts: QueryOptions, options?: KamiOptions) =>
    _getLazyKamis(world, components, queryOpts, options);
};

const _getLazyKamis = (
  world: World,
  components: Components,
  queryOpts: QueryOptions,
  options?: KamiOptions
): Array<() => Kami> => {
  const kamiIDs = query(components, queryOpts);
  return kamiIDs.map(
    (index): (() => Kami) =>
      () =>
        getKami(world, components, index, options)
  );
};
