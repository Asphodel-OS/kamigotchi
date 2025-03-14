import { EntityID, EntityIndex, HasValue, runQuery } from '@mud-classic/recs';
import { BigNumberish } from 'ethers';
import { Components } from 'network/';
import { hashArgs } from './IDs';

/////////////////
// QUERIES

export const queryRefsWithParent = (components: Components, anchorID: EntityID): EntityIndex[] => {
  const { AnchorID } = components;
  return Array.from(runQuery([HasValue(AnchorID, { value: anchorID })]));
};

export const queryRefChildren = (
  components: Components,
  field: string,
  anchorID: EntityID,
  key?: BigNumberish
): EntityIndex[] => {
  const { AnchorID } = components;

  const id = genRef(field, anchorID, key);
  return Array.from(runQuery([HasValue(AnchorID, { value: id })]));
};

/////////////////
// UTILS

export const genRef = (field: string, anchorID: EntityID, key?: BigNumberish): EntityID => {
  const args = key
    ? ['reference.instance', field, key, anchorID]
    : ['reference.instance', field, anchorID];
  const argTypes = key
    ? ['string', 'string', 'uint256', 'uint256']
    : ['string', 'string', 'uint256'];
  return hashArgs(args, argTypes);
};
