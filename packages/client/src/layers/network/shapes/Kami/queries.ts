import { EntityID, EntityIndex, Has, HasValue, QueryFragment, runQuery } from '@mud-classic/recs';

import { NetworkLayer } from 'layers/network/types';
import { Kami, Options, getKami } from './types';

// fields to filter by (only supports an AND of all fields)
export type QueryOptions = {
  account?: EntityID;
  state?: string;
};

export const queryKamisX = (
  network: NetworkLayer,
  options: QueryOptions,
  kamiOptions?: Options // pass through options for what's included on kami shape
): Kami[] => {
  const kamiIDs = queryKamiEntitiesX(network, options);

  return kamiIDs.map((index): Kami => getKami(network, index, kamiOptions));
};

// returns raw entity indices
export const queryKamiEntitiesX = (network: NetworkLayer, options: QueryOptions): EntityIndex[] => {
  const {
    components: { AccountID, IsPet, State },
  } = network;

  const toQuery: QueryFragment[] = [Has(IsPet)];

  if (options?.account) {
    toQuery.push(HasValue(AccountID, { value: options.account }));
  }

  if (options?.state) {
    toQuery.push(HasValue(State, { value: options.state }));
  }

  return Array.from(runQuery(toQuery));
};

export const getAllKamis = (network: NetworkLayer, options?: Options) => {
  return queryKamisX(network, {}, options);
};

// get a kami by its index (token ID)
export const getKamiByIndex = (network: NetworkLayer, index: number, options?: Options) => {
  const {
    components: { IsPet, PetIndex },
  } = network;
  const kamiEntityIndex = Array.from(
    runQuery([Has(IsPet), HasValue(PetIndex, { value: index })])
  )[0];
  return getKami(network, kamiEntityIndex, options);
};
