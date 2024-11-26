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

  const id = genRef(field, parentID, key);
  return Array.from(runQuery([HasValue(ParentID, { value: id })]));
};

/////////////////
// UTILS

export const genRef = (field: string, parentID: EntityID, key?: BigNumberish): EntityID => {
  const args = key
    ? ['reference.instance', field, key, parentID]
    : ['reference.instance', field, parentID];
  const argTypes = key
    ? ['string', 'string', 'uint256', 'uint256']
    : ['string', 'string', 'uint256'];
  return hashArgs(args, argTypes);
};
