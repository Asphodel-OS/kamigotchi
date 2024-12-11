import { EntityIndex, HasValue, QueryFragment, World, runQuery } from '@mud-classic/recs';
import { Components } from 'network/';

import { Condition, getCondition } from 'network/shapes/Conditional';
import {
  Coord,
  Room,
  RoomOptions,
  coordToBigInt,
  getGateFromPtr,
  getGateToPtr,
  getRoom,
} from './types';

export type QueryOptions = {
  index?: number;
  location?: Coord;
};

export const queryGates = (
  world: World,
  components: Components,
  toIndex: number,
  fromIndex: number
): Condition[] => {
  const { RoomID, ParentID } = components;

  const toQuery = [
    HasValue(RoomID, { value: getGateToPtr(toIndex) }),
    HasValue(ParentID, { value: fromIndex == 0 ? '0x00' : getGateFromPtr(fromIndex) }),
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
  const { Location, EntityType, RoomIndex } = components;

  const toQuery: QueryFragment[] = [];
  if (options?.index) toQuery.push(HasValue(RoomIndex, { value: options.index }));
  if (options?.location) {
    toQuery.push(
      HasValue(Location, {
        value: '0x' + ('0' + coordToBigInt(options.location).toString(16)).slice(-48),
      })
    );
  }
  toQuery.push(HasValue(EntityType, { value: 'ROOM' }));

  return Array.from(runQuery(toQuery));
};
