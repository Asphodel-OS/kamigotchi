import { EntityID, EntityIndex, HasValue, runQuery } from '@mud-classic/recs';
import { BigNumberish } from 'ethers';
import { Components } from 'network/';
import { hashArgs } from './IDs';

/////////////////
// QUERIES

export const queryRefsWithParent = (components: Components, parentID: EntityID): EntityIndex[] => {
  const { ParentID } = components;
  return Array.from(runQuery([HasValue(ParentID, { value: parentID })]));
};

export const queryRefChildren = (
  components: Components,
  field: string,
  parentID: EntityID,
  key?: BigNumberish
): EntityIndex[] => {
  const { ParentID } = components;

  const id = genID(field, parentID, key);
  return Array.from(runQuery([HasValue(ParentID, { value: id })]));
};

/////////////////
// UTILS

const genID = (field: string, parentID: EntityID, key?: BigNumberish): EntityID => {
  const args = key
    ? ['reference.instance', field, key, parentID]
    : ['reference.instance', field, parentID];
  const argTypes = key
    ? ['string', 'uint256', 'uint256', 'uint256']
    : ['string', 'uint256', 'uint256'];
  return hashArgs(args, argTypes);
};
