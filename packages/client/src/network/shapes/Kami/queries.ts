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

// get a kami by its index (token ID)
// export const getKamiByIndex = (
//   world: World,
//   components: Components,
//   index: number,
//   options?: KamiOptions
// ) => {
//   return queryKamisX(world, components, { index: index }, options)[0];
// };
// get a kami by its index (token ID)
export const getKamiByIndex = (
  world: World,
  components: Components,
  index: number,
  options?: KamiOptions
) => {
  const { IsPet, PetIndex } = components;
  const kamiEntityIndex = Array.from(
    runQuery([HasValue(PetIndex, { value: index }), Has(IsPet)])
  )[0];
  return getKami(world, components, kamiEntityIndex, options);
};

export const getAllKamis = (world: World, components: Components, options?: KamiOptions) => {
  return queryKamisX(world, components, {}, options);
};

export const getLazyKamis = (
  world: World,
  components: Components
): ((queryOpts: QueryOptions, options?: KamiOptions) => Array<() => Kami>) => {
  return (queryOpts: QueryOptions, options?: KamiOptions) =>
    _getLazyKamis(world, components, queryOpts, options);
};

export const queryKamisX = (
  world: World,
  components: Components,
  queryOptions: QueryOptions,
  options?: KamiOptions
): Kami[] => {
  const kamiIDs = queryKamiEntitiesX(components, queryOptions);
  return kamiIDs.map((index): Kami => getKami(world, components, index, options));
};

// returns raw entity indices
export const queryKamiEntitiesX = (
  components: Components,
  options: QueryOptions
): EntityIndex[] => {
  const { OwnsPetID, IsPet, State, PetIndex } = components;

  const toQuery: QueryFragment[] = [];
  if (options?.index) toQuery.push(HasValue(PetIndex, { value: options.index }));
  if (options?.account) toQuery.push(HasValue(OwnsPetID, { value: options.account }));
  if (options?.state) toQuery.push(HasValue(State, { value: options.state }));
  toQuery.push(Has(IsPet));

  return Array.from(runQuery(toQuery));
};

//////////////////
// INTERNAL

const _getLazyKamis = (
  world: World,
  components: Components,
  queryOpts: QueryOptions,
  options?: KamiOptions
): Array<() => Kami> => {
  const kamiIDs = queryKamiEntitiesX(components, queryOpts);

  return kamiIDs.map(
    (index): (() => Kami) =>
      () =>
        getKami(world, components, index, options)
  );
};
