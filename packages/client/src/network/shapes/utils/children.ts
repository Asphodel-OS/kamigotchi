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

export const queryChildrenOfEntityIndex = (
  components: Components,
  field: string,
  index: number
): EntityIndex[] => {
  return queryChildrenOf(components, genID(field, index));
};

/////////////////
// UTILS

export const genID = (field: string, index: number): EntityID => {
  return hashArgs([field, index], ['string', 'uint32']);
};
