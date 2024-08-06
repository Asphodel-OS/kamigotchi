import { EntityID, EntityIndex, HasValue, QueryFragment, runQuery } from '@mud-classic/recs';
import { formatEntityID } from 'engine/utils';
import { utils } from 'ethers';
import { Components } from 'network/';

// libraries for interactions with IDPointerComponent shapes (children)

/////////////////
// QUERIES

export const queryChildrenOf = (components: Components, parentID: EntityID): EntityIndex[] => {
  const { PointerID } = components;
  const toQuery: QueryFragment[] = [HasValue(PointerID, { value: parentID })];
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

const IDStore = new Map<string, string>();

export const genID = (field: string, index: number): EntityID => {
  let id = '';
  const key = field + index.toString();

  if (IDStore.has(key)) id = IDStore.get(key)!;
  else id = utils.solidityKeccak256(['string', 'uint32'], [field, index]) as EntityID;

  return formatEntityID(id);
};
