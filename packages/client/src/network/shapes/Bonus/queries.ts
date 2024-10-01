import { EntityID, EntityIndex, HasValue, QueryFragment, runQuery } from '@mud-classic/recs';
import { Components } from 'network/';
import { queryChildrenOf } from '../utils';
import { getTypeID } from './types';

export function queryBonusForType(
  components: Components,
  field: string,
  holderID: EntityID
): EntityIndex[] {
  const { TypeID } = components;
  if (!TypeID) return [];
  const id = getTypeID(field, holderID);
  const toQuery: QueryFragment[] = [HasValue(TypeID, { value: id })];
  return Array.from(runQuery(toQuery));
}

export function queryBonusForParent(components: Components, parentID: EntityID): EntityIndex[] {
  return queryChildrenOf(components, parentID);
}
