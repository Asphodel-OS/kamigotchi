import { EntityID } from '@mud-classic/recs';
import { hashArgs } from '../utils';

export const genRefParentID = (index: number): EntityID => {
  return hashArgs(['item.usecase', index], ['string', 'uint32']);
};
