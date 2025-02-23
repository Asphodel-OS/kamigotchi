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
