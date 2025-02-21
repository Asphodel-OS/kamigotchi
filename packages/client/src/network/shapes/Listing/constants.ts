import { EntityID, EntityIndex } from '@mud-classic/recs';
import { NullItem } from '../Item';
import { Listing } from './types';

export const NullListing: Listing = {
  id: '0' as EntityID,
  entity: 0 as EntityIndex,
  item: NullItem,
  value: 0,
  balance: 0,
  startTime: 0,
  requirements: [],
  buy: {
    currency: NullItem, // musu
    type: 'FIXED',
  },
};
