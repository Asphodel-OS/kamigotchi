import { EntityID, EntityIndex, HasValue, QueryFragment, runQuery } from '@mud-classic/recs';
import { Components } from 'network/';
import { hashArgs } from './IDs';

// libraries for interactions with IDParentComponent shapes (children)

/////////////////
// QUERIES

export const queryChildrenOf = (components: Components, parentID: EntityID): EntityIndex[] => {
  const { ParentID } = components;
  const toQuery: QueryFragment[] = [HasValue(ParentID, { value: parentID })];
  return Array.from(runQuery(toQuery));
};

/////////////////
// UTILS

export const genID = (field: string, index: number): EntityID => {
  return hashArgs([field, index], ['string', 'uint32']);
};
