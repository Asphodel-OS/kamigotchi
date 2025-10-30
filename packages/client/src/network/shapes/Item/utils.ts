import { EntityID } from 'engine/recs';
import { hashArgs } from '../utils';

export const genRefAnchorID = (index: number): EntityID => {
  return hashArgs(['item.usecase', index], ['string', 'uint32']);
};
