import { EntityID, EntityIndex, HasValue, QueryFragment, runQuery } from '@mud-classic/recs';

import { Components } from 'network/';

export type QueryOptions = {
  sellerID?: EntityID;
};

export const query = (components: Components, options?: QueryOptions): EntityIndex[] => {
  const { EntityType, OwnsTradeID } = components;
  const toQuery: QueryFragment[] = [];

  if (options?.sellerID != undefined)
    toQuery.push(HasValue(OwnsTradeID, { value: options.sellerID }));
  toQuery.push(HasValue(EntityType, { value: 'TRADE' }));

  const results = runQuery(toQuery);
  return Array.from(results);
};
