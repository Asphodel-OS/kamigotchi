import {
  EntityID,
  Has,
  HasValue,
  runQuery,
  QueryFragment,
  EntityIndex,
} from '@latticexyz/recs';

import { Kami, getKami, queryKamiEntitiesX, QueryOptions, Options } from 'layers/network/shapes/Kami';
import { NetworkLayer } from 'layers/network/types';

export const getLazyKamis = (
  network: NetworkLayer
): (queryOpts: QueryOptions, options?: Options) => Array<() => Kami> => {
  return (
    queryOpts: QueryOptions,
    options?: Options
  ) => _getLazyKamis(network, queryOpts, options);
}

const _getLazyKamis = (
  network: NetworkLayer,
  queryOpts: QueryOptions,
  options?: Options
): Array<() => Kami> => {
  const kamiIDs = queryKamiEntitiesX(network, queryOpts);

  return kamiIDs.map(
    (index): () => Kami => () => getKami(
      network,
      index,
      options
    )
  );
};