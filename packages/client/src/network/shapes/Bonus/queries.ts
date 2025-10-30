import { EntityID, EntityIndex, HasValue, QueryFragment, runQuery } from 'engine/recs';
import { Components } from 'network/';
import { hashArgs, queryChildrenOf } from '../utils';
import { genEndAnchor } from './types';

// query the bonuses of a type for a parent entity
export function queryForType(comps: Components, field: string, holderID: EntityID): EntityIndex[] {
  const { TypeID } = comps;
  const types = ['string', 'string', 'uint256'];
  const values = ['bonus.type', field, holderID];
  const id = hashArgs(values, types);
  const toQuery: QueryFragment[] = [HasValue(TypeID, { value: id })];
  return Array.from(runQuery(toQuery));
}

export function queryForEndType(
  comps: Components,
  endType: string,
  holderID: EntityID
): EntityIndex[] {
  const EndAnchor = genEndAnchor(endType, holderID);
  return queryForParent(comps, EndAnchor);
}

// query the bonuses associated with a parent entity
export function queryForParent(comps: Components, id: EntityID): EntityIndex[] {
  return queryChildrenOf(comps, id);
}
