import { EntityID, EntityIndex, Has, HasValue, QueryFragment, runQuery } from 'engine/recs';

import { Components } from 'network/';

export type QueryOptions = {
  sellerID?: EntityID;
};

export const query = (components: Components, options?: QueryOptions): EntityIndex[] => {
  const { OwnsTradeID } = components;
  const toQuery: QueryFragment[] = [];

  if (options?.sellerID != undefined)
    toQuery.push(HasValue(OwnsTradeID, { value: options.sellerID }));
  toQuery.push(Has(OwnsTradeID)); // only trades have OwnsTradeID

  const results = runQuery(toQuery);
  return Array.from(results);
};
