import { EntityID, EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { Listing } from '../Listing';
import { getName, getNPCIndex, getRoomIndex } from '../utils/component';
import { getListings } from './listings';

// standardized shape of a FE NPC Entity
export interface NPC {
  entity: EntityIndex;
  id: EntityID;
  index: number;
  name: string;
  roomIndex: number;
  listings: Listing[];
}

export interface Options {
  listings: boolean;
}

// get an NPC from its EntityIndex
export const get = (
  world: World,
  comps: Components,
  entity: EntityIndex,
  options?: Options
): NPC => {
  const npc: NPC = {
    entity,
    id: world.entities[entity],
    index: getNPCIndex(comps, entity),
    name: getName(comps, entity),
    roomIndex: getRoomIndex(comps, entity),
    listings: [],
  };

  if (options?.listings) npc.listings = getListings(world, comps, npc.index);
  return npc;
};
