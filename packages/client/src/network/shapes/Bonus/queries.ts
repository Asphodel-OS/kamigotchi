import { EntityID, EntityIndex, HasValue, QueryFragment, runQuery } from '@mud-classic/recs';
import { Components } from 'network/';
import { hashArgs, queryChildrenOf } from '../utils';

// query the bonuses of a type for a parent entity
export function queryForType(
  components: Components,
  field: string,
  holderID: EntityID
): EntityIndex[] {
  const { TypeID } = components;
  const types = ['string', 'string', 'uint256'];
  const values = ['bonus.type', field, holderID];
  const id = hashArgs(values, types);
  const toQuery: QueryFragment[] = [HasValue(TypeID, { value: id })];
  return Array.from(runQuery(toQuery));
}

// query the bonuses associated with a parent entity
export function queryForParent(components: Components, id: EntityID): EntityIndex[] {
  return queryChildrenOf(components, id);
}
