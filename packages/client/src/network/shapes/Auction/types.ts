import { EntityID, EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/components';
import { getItemByIndex, Item } from '../Item';
import {
  getBalance,
  getDecay,
  getEntityType,
  getIndex,
  getItemIndex,
  getMax,
  getPeriod,
  getRate,
  getStartTime,
  getValue,
} from '../utils/component';

// Auction represents a unidirectional Discrete GDA between two items
export interface Auction {
  id: EntityID;
  entity: EntityIndex;
  ObjectType: string;
  auctionItem?: Item; // item being auctioned
  paymentItem?: Item; // item used as payment
  params: {
    value: number; // initial target value of pricing curve
    period: number; // reference duration period (in seconds)
    decay: number; // price decay per period (1e6)
    rate: number; // number of sales per period to counteract decay
  };
  supply: {
    sold: number; // supply sold since start
    total: number; // total supply to sell
  };
  time: {
    start: number;
  };
}

export interface Options {
  auctionItem?: boolean;
  paymentItem?: boolean;
}

// get an Auction from its EntityIndex
export const get = (
  world: World,
  components: Components,
  entity: EntityIndex,
  options?: Options
): Auction => {
  const auction: Auction = {
    id: world.entities[entity],
    entity,
    ObjectType: getEntityType(components, entity),
    supply: {
      sold: getBalance(components, entity),
      total: getMax(components, entity),
    },
    params: {
      value: getValue(components, entity),
      decay: getDecay(components, entity, 6),
      period: getPeriod(components, entity),
      rate: getRate(components, entity),
    },
    time: {
      start: getStartTime(components, entity),
    },
  };

  if (options?.auctionItem) {
    const itemIndex = getIndex(components, entity);
    auction.auctionItem = getItemByIndex(world, components, itemIndex);
  }

  if (options?.paymentItem) {
    const itemIndex = getItemIndex(components, entity);
    auction.paymentItem = getItemByIndex(world, components, itemIndex);
  }

  return auction;
};
