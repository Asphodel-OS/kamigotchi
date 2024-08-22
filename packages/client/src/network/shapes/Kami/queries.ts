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
import { Kami, Options as KamiOptions, getKami } from './types';

// fields to filter by (only supports an AND of all fields)
export type QueryOptions = {
  account?: EntityID;
  index?: number;
  state?: string;
};

// returns raw entity indices
export const query = (components: Components, options: QueryOptions): EntityIndex[] => {
  const { OwnsPetID, IsPet, State, PetIndex } = components;

  const toQuery: QueryFragment[] = [Has(IsPet)];
  if (options?.index) toQuery.push(HasValue(PetIndex, { value: options.index }));
  if (options?.account) toQuery.push(HasValue(OwnsPetID, { value: options.account }));
  if (options?.state) toQuery.push(HasValue(State, { value: options.state }));

  return Array.from(runQuery(toQuery));
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
