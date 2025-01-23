import { EntityID, Has, HasValue, QueryFragment, runQuery } from '@mud-classic/recs';

import { Components } from 'network/';

export const queryForHolder = (components: Components, holderID: EntityID, field: string) => {
  const { HolderID, Type, RevealBlock } = components;
  const toQuery: QueryFragment[] = [
    HasValue(HolderID, { value: holderID }),
    HasValue(Type, { value: field }),
    Has(RevealBlock),
  ];
  return Array.from(runQuery(toQuery)).reverse(); // reversed for descending time order
};
