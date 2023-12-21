
import {
  EntityID,
  Has,
  HasValue,
  runQuery,
  QueryFragment,
} from '@latticexyz/recs';

import { Layers } from 'src/types';
import { Kami, Options, getKami } from './types';

// items to query
interface QueryOptions {
  account?: EntityID;
  state?: string;
}

export const queryKamisX = (
  layers: Layers,
  options: QueryOptions,
  kamiOptions?: Options
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