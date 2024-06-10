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
import { Kami, Options, getKami } from './types';

// fields to filter by (only supports an AND of all fields)
export type QueryOptions = {
  account?: EntityID;
  state?: string;
};

export const queryKamisX = (
  world: World,
  components: Components,
  queryOptions: QueryOptions,
  options?: Options
): Kami[] => {
  const kamiIDs = queryKamiEntitiesX(components, queryOptions);
  return kamiIDs.map((index): Kami => getKami(world, components, index, options));
};

// returns raw entity indices
export const queryKamiEntitiesX = (
  components: Components,
  options: QueryOptions
): EntityIndex[] => {
  const { OwnsPetID, IsPet, State } = components;

  const toQuery: QueryFragment[] = [Has(IsPet)];

  if (options?.account) {
    toQuery.push(HasValue(OwnsPetID, { value: options.account }));
  }

  if (options?.state) {
    toQuery.push(HasValue(State, { value: options.state }));
  }

  return Array.from(runQuery(toQuery));
};

export const getAllKamis = (world: World, components: Components, options?: Options) => {
  return queryKamisX(world, components, {}, options);
};

// get a kami by its index (token ID)
export const getKamiByIndex = (
  world: World,
  components: Components,
  index: number,
  options?: Options
) => {
  const { IsPet, PetIndex } = components;
  const kamiEntityIndex = Array.from(
    runQuery([Has(IsPet), HasValue(PetIndex, { value: index })])
  )[0];
  return getKami(world, components, kamiEntityIndex, options);
};
