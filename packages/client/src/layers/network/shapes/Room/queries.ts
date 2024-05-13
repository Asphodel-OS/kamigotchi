import { EntityIndex, Has, HasValue, QueryFragment, World, runQuery } from '@mud-classic/recs';
import { Components } from 'layers/network';

import { Condition, getCondition } from 'layers/network/shapes/utils/Conditionals';
import { Location, Room, RoomOptions, getGateFromPtr, getGateToPtr, getRoom } from './types';

export type QueryOptions = {
  index?: number;
  location?: Location;
};

export const queryGates = (
  world: World,
  components: Components,
  toIndex: number,
  fromIndex: number
): Condition[] => {
  const { RoomID, SourceID } = components;

  const toQuery = [
    HasValue(RoomID, { value: getGateToPtr(toIndex) }),
    HasValue(SourceID, { value: fromIndex == 0 ? '0x00' : getGateFromPtr(fromIndex) }),
  ];

  const raw = Array.from(runQuery(toQuery));

  return raw.map((index): Condition => getCondition(world, components, index));
};

export const queryRoomsX = (
  world: World,
  components: Components,
  options: QueryOptions,
  roomOptions?: RoomOptions
): Room[] => {
  const entities = queryRoomsEntitiesX(components, options);
  return entities.map((entity) => {
    return getRoom(world, components, entity, roomOptions);
  });
};

// returns raw entity index
export const queryRoomsEntitiesX = (
  components: Components,
  options: QueryOptions
): EntityIndex[] => {
  const { Location, IsRoom, RoomIndex } = components;

  const toQuery: QueryFragment[] = [Has(IsRoom)];

  if (options?.index) toQuery.push(HasValue(RoomIndex, { value: options.index }));

  if (options?.location)
    toQuery.push(
      HasValue(Location, {
        x: options.location.x,
        y: options.location.y,
        z: options.location.z,
      })
    );

  return Array.from(runQuery(toQuery));
};
