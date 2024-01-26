
import {
  EntityID,
  Has,
  HasValue,
  runQuery,
  QueryFragment,
} from '@latticexyz/recs';

import { Kami, Options, getKami } from './types';
import { NetworkLayer } from 'layers/network/types';

// fields to filter by (only supports an AND of all fields)
interface QueryOptions {
  account?: EntityID;
  state?: string;
}

export const queryKamisX = (
  network: NetworkLayer,
  options: QueryOptions,
  kamiOptions?: Options // pass through options for what's included on kami shape
): Kami[] => {
  const {
    components: {
      AccountID,
      IsPet,
      State,
    },
  } = network;

  const toQuery: QueryFragment[] = [Has(IsPet)];

  if (options?.account) {
    toQuery.push(HasValue(AccountID, { value: options.account }));
  }

  if (options?.state) {
    toQuery.push(HasValue(State, { value: options.state }));
  }

  const kamiIDs = Array.from(
    runQuery(toQuery)
  );

  return kamiIDs.map(
    (index): Kami => getKami(
      network,
      index,
      kamiOptions
    )
  );;
};

export const getAllKamis = (
  network: NetworkLayer,
  options?: Options
) => {
  return queryKamisX(network, {}, options);
}

// get a kami by its index (token ID)
export const getKamiByIndex = (
  network: NetworkLayer,
  index: number,
  options?: Options
) => {
  const { components: { IsPet, PetIndex } } = network;
  const kamiEntityIndex = Array.from(
    runQuery([
      Has(IsPet),
      HasValue(PetIndex, { value: index }),
    ])
  )[0];
  return getKami(network, kamiEntityIndex, options);
}
