
import {
  EntityID,
  Has,
  HasValue,
  runQuery,
  QueryFragment,
} from '@latticexyz/recs';

import { Layers } from 'src/types';
import { Kami, Options, getKami } from './types';

// fields to filter by (only supports an AND of all fields)
interface QueryOptions {
  account?: EntityID;
  state?: string;
}

export const queryKamisX = (
  layers: Layers,
  options: QueryOptions,
  kamiOptions?: Options // pass through options for what's included on kami shape
): Kami[] => {
  const {
    network: {
      components: {
        AccountID,
        IsPet,
        State,
      },
    },
  } = layers;

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
      layers,
      index,
      kamiOptions
    )
  );;
};

// get a kami by its index (token ID)
export const getKamiByIndex = (
  layers: Layers,
  index: number,
  options?: Options
) => {
  const { network: { components: { IsPet, PetIndex } } } = layers;
  const kamiEntityIndex = Array.from(
    runQuery([
      Has(IsPet),
      HasValue(PetIndex, { value: index }),
    ])
  )[0];
  return getKami(layers, kamiEntityIndex, options);
}
