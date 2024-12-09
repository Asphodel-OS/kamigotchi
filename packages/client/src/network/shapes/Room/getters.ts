import { World } from '@mud-classic/recs';

import { Components } from 'network/';
import { QueryOptions, query } from './queries';
import { Room, RoomOptions, getRoom } from './types';

export const getRoomsX = (
  world: World,
  components: Components,
  options: QueryOptions,
  roomOptions?: RoomOptions
): Room[] => {
  const entities = query(components, options);
  return entities.map((entity) => {
    return getRoom(world, components, entity, roomOptions);
  });
};
