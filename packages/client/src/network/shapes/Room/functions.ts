import { getComponentValue, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { getRoomsX } from './getters';
import { query } from './queries';
import { getRoom, Room, RoomOptions } from './types';
import { Coord, getAdjacentLocations } from './utils';

export const getAllRooms = (
  world: World,
  components: Components,
  options?: RoomOptions
): Room[] => {
  return getRoomsX(world, components, {}, options);
};

export const getRoomByIndex = (
  world: World,
  components: Components,
  index: number,
  options?: RoomOptions
): Room => {
  const entities = query(components, { index: index });
  return getRoom(world, components, entities[0], options);
};

export const getAdjacentRoomIndices = (components: Components, location: Coord): number[] => {
  const { RoomIndex } = components;

  const results: number[] = [];
  const adjLocs = getAdjacentLocations(location);
  for (let i = 0; i < adjLocs.length; i++) {
    const ids = query(components, { location: adjLocs[i] });

    if (ids.length > 0) {
      // room exists at location, add index to results
      results.push((getComponentValue(RoomIndex, ids[0])?.value || 0) * 1);
    }
  }

  return results;
};
