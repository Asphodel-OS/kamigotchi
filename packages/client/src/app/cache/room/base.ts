import { EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { queryRoomByIndex, Room } from 'network/shapes/Room';
import { getExitsFor } from 'network/shapes/Room/exit';
import { getRoom, NullRoom } from 'network/shapes/Room/types';

export const RoomCache = new Map<EntityIndex, Room>();
export const ExitUpdateTs = new Map<EntityIndex, number>();

interface Options {
  exits?: number;
}

export const get = (
  world: World,
  components: Components,
  entity: EntityIndex,
  options?: Options
): Room => {
  if (!RoomCache.has(entity)) process(world, components, entity);
  const room = RoomCache.get(entity) ?? NullRoom;
  if (room.index == 0 || !options) return room;

  // populate the exits as requested
  if (options?.exits) {
    const updateTs = ExitUpdateTs.get(entity) ?? 0;
    const updateDelta = (Date.now() - updateTs) / 1000; // convert to seconds
    if (updateDelta > options.exits) {
      room.exits = getExitsFor(world, components, room);
      ExitUpdateTs.set(entity, Date.now());
    }
  }

  return room;
};

// process a base room entity into the cache
// TODO: add some logging here to ensure we warn when it's not a room entity
export const process = (world: World, components: Components, entity: EntityIndex) => {
  const room = getRoom(world, components, entity);
  if (room.index != 0) RoomCache.set(entity, room);
  return room;
};

// get a room through the caching layer by its index
export const getByIndex = (
  world: World,
  components: Components,
  index: number,
  options?: Options
): Room => {
  const entity = queryRoomByIndex(components, index);
  if (!entity) return NullRoom;
  return get(world, components, entity, options);
};
