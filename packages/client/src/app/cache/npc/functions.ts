import { World } from '@mud-classic/recs';

import { Components } from 'network/components';
import { passesConditions } from 'network/shapes/Conditional';
import { Listing } from 'network/shapes/Listing';
import { Account } from '../account';

// calculate the buy price of a listing based on amt purchased
export const calcBuyPrice = (listing: Listing, amt: number) => {
  if (!listing.buy || amt == 0) return 0;
  const pricing = listing.buy;
  const value = listing.value;

  if (pricing.type === 'FIXED') return value * amt;
  else console.warn('calcBuyPrice(): invalid pricing type', pricing);
  return 0;
};

// calculate the sell price of a listing based on amt sold
export const calcSellPrice = (listing: Listing, amt: number) => {
  if (!listing.sell || amt == 0) return 0;
  const pricing = listing.sell;
  const value = listing.value;

  if (pricing.type === 'FIXED') return value * amt;
  else if (pricing.type === 'SCALED') return calcBuyPrice(listing, amt) * pricing.scale;
  else console.warn('calcSellPrice(): invalid pricing type', pricing);
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
