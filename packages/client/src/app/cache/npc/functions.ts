import { World } from '@mud-classic/recs';

import { Components } from 'network/components';
import { passesConditions } from 'network/shapes/Conditional';
import { Listing } from 'network/shapes/Listing';
import { NPC } from 'network/shapes/Npc';
import { getBalance } from 'network/shapes/utils/component';
import { Account } from '../account';

export const refreshListings = (components: Components, npc: NPC) => {
  npc.listings.forEach((l) => {
    l.balance = getBalance(components, l.entity);
  });
};

// calculate the buy price of a listing based on amt purchased
export const calcBuyPrice = (listing: Listing, amt: number) => {
  if (!listing.buy || amt == 0) return 0;
  const pricing = listing.buy;
  const value = listing.value;

  if (pricing.type === 'FIXED') {
    return value * amt;
  } else if (pricing.type === 'GDA') {
    const pTarget = listing.value;
    const tDelta = Date.now() / 1000 - listing.startTime;
    const scale = pricing?.scale ?? 1.0;
    const decay = pricing?.decay ?? 0.0;
    const prevSold = listing.balance;

    const num1 = pTarget * scale ** prevSold;
    const num2 = scale ** amt - 1.0;
    const den1 = Math.exp(decay * tDelta);
    const den2 = scale - 1.0;
    const priceRaw = (num1 * num2) / (den1 * den2);
    return Math.ceil(priceRaw);
  } else console.warn('calcBuyPrice(): invalid pricing type', pricing);
  return 0;
};

// calculate the sell price of a listing based on amt sold
export const calcSellPrice = (listing: Listing, amt: number) => {
  if (!listing.sell || amt == 0) return 0;
  const pricing = listing.sell;
  const value = listing.value;

  if (pricing.type === 'FIXED') {
    return value * amt;
  } else if (pricing.type === 'SCALED') {
    const scale = pricing?.scale ?? 0;
    return scale * calcBuyPrice(listing, amt);
  } else console.warn('calcSellPrice(): invalid pricing type', pricing);
  return 0;
};

export const cleanListings = (
  world: World,
  comps: Components,
  listings: Listing[],
  account: Account
) => {
  const filtered = filterListings(world, comps, listings, account);
  const sorted = sortListings(filtered);
  return sorted;
};

export const filterListings = (
  world: World,
  comps: Components,
  listings: Listing[],
  account: Account
): Listing[] => {
  return listings.filter((l) => passesConditions(world, comps, l.requirements, account));
};

// sorts listing by item index
export const sortListings = (listings: Listing[]): Listing[] => {
  return listings.sort((a, b) => a.item.index - b.item.index);
};
