import { EntityID, EntityIndex } from '@mud-classic/recs';
import { Auction } from './types';

export const NullAuction: Auction = {
  id: '0' as EntityID,
  entity: 0 as EntityIndex,
  ObjectType: 'AUCTION',
  items: {
    outIndex: 0,
    inIndex: 0,
  },
  params: {
    value: 0,
    decay: 0,
    scale: 0,
  },
  supply: {
    sold: 0,
    total: 0,
  },
  time: {
    start: 0,
    reset: 0,
  },
};
