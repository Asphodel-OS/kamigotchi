import { EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { Auction, getAuction, NullAuction } from 'network/shapes/Auction';
import { getBalance } from 'network/shapes/utils/component';
import { queryOne } from './queries';

// auctions shouldnt change all that much while live
export const AuctionCache = new Map<EntityIndex, Auction>(); // auction entity -> auction
export const SupplyUpdateTs = new Map<EntityIndex, number>(); // last update of the sold sub-object (s)

// retrieve an auction's most recent data and update it on the cache
export const process = (world: World, components: Components, entity: EntityIndex) => {
  const auction = getAuction(world, components, entity);
  if (auction.entity != 0) AuctionCache.set(entity, auction);
  return auction;
};

export interface RefreshOptions {
  balance?: number; // cadence to force update sold amount
}

// get an auction from its EntityIndex
export const get = (
  world: World,
  components: Components,
  entity: EntityIndex,
  options?: RefreshOptions,
  debug?: boolean
) => {
  if (entity == 0) return NullAuction;
  if (!AuctionCache.has(entity)) process(world, components, entity);
  const auction = AuctionCache.get(entity);
  if (!auction) return NullAuction;

  if (debug) {
    const outIndex = auction.items.outIndex;
    const inIndex = auction.items.inIndex;
    console.log(`===Retrieving Auction ${outIndex} ${inIndex}===`);
  }
  if (!options) return auction;

  const now = Date.now();

  if (options.balance != undefined) {
    const updateTs = SupplyUpdateTs.get(entity) ?? 0;
    const updateDelta = (now - updateTs) / 1000; // convert to seconds
    if (updateDelta > options.balance) {
      auction.supply.sold = getBalance(components, entity);
      SupplyUpdateTs.set(entity, now);
    }
  }

  return auction;
};

// helper function stitching together both querying and cache getter
export const getByIndex = (
  world: World,
  components: Components,
  index: number,
  options?: RefreshOptions
) => {
  const entity = queryOne(components, { outputItem: index });
  return get(world, components, entity, options);
};
