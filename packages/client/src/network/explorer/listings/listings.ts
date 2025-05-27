import { EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { getAllListings, getItemListings, getListing, getListingBy } from 'network/shapes/Listing';
import { getNPCListings } from 'network/shapes/Npc';

export const listings = (world: World, comps: Components) => {
  return {
    all: () => getAllListings(world, comps),
    get: (entity: EntityIndex) => getListing(world, comps, entity),
    getByNPC: (index: number) => getNPCListings(world, comps, index),
    getByItem: (index: number) => getItemListings(world, comps, index),
    getBy: (itemIndex: number, npcIndex: number) =>
      getListingBy(world, comps, { itemIndex, npcIndex }),
  };
};
