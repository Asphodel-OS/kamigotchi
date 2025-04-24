export { NullRoom } from './constants';
export { getExitsFor as getExitsForRoom } from './exit';
export { getAllRooms, getRoomByIndex } from './functions';
export { getGates } from './gate';
export { getRoomsX } from './getters';
export { queryByIndex as queryRoomByIndex, query as queryRooms } from './queries';
export { getRoom } from './types';

export type { Exit } from './exit';
export type { QueryOptions } from './queries';
export type { Room, RoomOptions } from './types';
export type { Coord } from './utils';
