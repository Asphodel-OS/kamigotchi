import { EntityID, EntityIndex, HasValue, QueryFragment, runQuery } from '@mud-classic/recs';
import { formatEntityID } from 'engine/utils';
import { utils } from 'ethers';
import { Components } from 'network/';

// libraries for interactions with IDPointerComponent shapes (children)

/////////////////
// QUERIES

export const queryChildrenOfEntityIndex = (
  components: Components,
  field: string,
  index: number
): EntityIndex[] => {
  const { PointerID } = components;
  const toQuery: QueryFragment[] = [
    HasValue(PointerID, {
      value: genID(field, index),
    }),
  ];
  return Array.from(runQuery(toQuery));
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
