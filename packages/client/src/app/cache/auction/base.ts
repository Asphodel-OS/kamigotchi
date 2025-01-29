import { EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { Auction, getAuction } from 'network/shapes/Auction';
import { getBalance, getLimit, getResetTime, getValue } from 'network/shapes/utils/component';

// auctions shouldnt change all that much while live
export const AuctionCache = new Map<EntityIndex, Auction>(); // auction entity -> auction
export const SupplyUpdateTs = new Map<EntityIndex, number>(); // last update of the sold sub-object (s)
export const ResetUpdateTs = new Map<EntityIndex, number>(); // last update of the reset sub-object (s)

// retrieve an auction's most recent data and update it on the cache
export const process = (world: World, components: Components, entity: EntityIndex) => {
  const auction = getAuction(world, components, entity);
  if (auction.entity != 0) AuctionCache.set(entity, auction);
  return auction;
};

export interface RefreshOptions {
  supply?: number; // cadence to force update sold amount
  // reset?: number; // cadence to force update curve resets
}

// get an auction from its EntityIndex
export const get = (
  world: World,
  components: Components,
  entity: EntityIndex,
  options?: RefreshOptions,
  debug?: boolean
) => {
  if (!AuctionCache.has(entity)) process(world, components, entity);
  const auction = AuctionCache.get(entity)!;
  if (debug) {
    const outIndex = auction.items.outIndex;
    const inIndex = auction.items.inIndex;
    console.log(`===Retrieving Auction ${outIndex} ${inIndex}===`);
  }
  if (!options) return auction;

  const now = Date.now();

  if (options.supply != undefined) {
    const updateTs = SupplyUpdateTs.get(entity) ?? 0;
    const updateDelta = (now - updateTs) / 1000; // convert to seconds
    if (updateDelta > options.supply) {
      const newBalance = getBalance(components, entity);

      // if the sold balance drops, it indicates the curve has been reset
      if (newBalance >= auction.supply.sold) {
        auction.supply.sold = getBalance(components, entity);
      } else {
        console.warn('Auction: balance drop detected, updating params');
        auction.time.reset = getResetTime(components, entity);
        auction.supply.sold = getBalance(components, entity);
        auction.supply.total = getLimit(components, entity);
        auction.params.value = getValue(components, entity);
        ResetUpdateTs.set(entity, now);
      }
      SupplyUpdateTs.set(entity, now);
    }
  }
};
