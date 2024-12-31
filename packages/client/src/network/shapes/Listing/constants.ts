import { EntityID, EntityIndex } from '@mud-classic/recs';
import { NullItem } from '../Item/types';
import { Listing } from './types';

export const NullListing: Listing = {
  id: '0' as EntityID,
  entity: 0 as EntityIndex,
  item: NullItem,
  buyPrice: 0,
  requirements: [],
};
