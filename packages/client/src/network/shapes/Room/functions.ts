import { World } from '@mud-classic/recs';

import { Components } from 'network/';
import { Condition } from '../Conditional';
import { queryGates, queryRoomsEntitiesX, queryRoomsX } from './queries';
import { Room, RoomOptions, getRoom } from './types';

export const getAllRooms = (world: World, components: Components, options?: RoomOptions): Room[] =>
  queryRoomsX(world, components, {}, options);

export const getRoomByIndex = (
  world: World,
  components: Components,
  index: number,
  options?: RoomOptions
): Room => {
  const entities = queryRoomsEntitiesX(components, { index: index });
  return getRoom(world, components, entities[0], options);
};

export const getGatesBetween = (
  world: World,
  components: Components,
  to: number,
  from: number
): Condition[] => {
  const gatesGeneral = queryGates(world, components, to, 0);
  const gatesBetween = queryGates(world, components, to, from);
  return [...gatesGeneral, ...gatesBetween];
};
