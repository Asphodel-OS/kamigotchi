import { World } from '@mud-classic/recs';
import { Components } from 'network/components';
import { Listing, getListing, queryNPCListings } from '../Listing';

export const getListings = (world: World, comps: Components, npcIndex: number): Listing[] => {
  const entities = queryNPCListings(comps, npcIndex);
  return entities.map((entity) => getListing(world, comps, entity));
};
