import { EntityIndex, Has, HasValue, QueryFragment, World, runQuery } from '@mud-classic/recs';
import { Components } from 'layers/network';

import { Condition, getCondition } from 'layers/network/shapes/utils/Conditionals';
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
  const { RoomID, PointerID } = components;

  const toQuery = [
    HasValue(RoomID, { value: getGateToPtr(toIndex) }),
    HasValue(PointerID, { value: fromIndex == 0 ? '0x00' : getGateFromPtr(fromIndex) }),
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

  if (options?.location) {
    toQuery.push(
      HasValue(Location, {
        value: '0x' + ('0' + coordToBigInt(options.location).toString(16)).slice(-48),
      })
    );
  }

  return Array.from(runQuery(toQuery));
};
