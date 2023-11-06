import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  QueryFragment,
  getComponentValue,
  hasComponent,
  runQuery,
} from '@mud-classic/recs';

import { NetworkLayer } from 'layers/network/types';
import { Account, getAccount } from './Account';

export interface Location {
  x: number;
  y: number;
  z: number;
}

// standardized Object shape of a Room Entity
export interface Room {
  index: number;
  entityIndex: EntityIndex;
  id: EntityID;
  name: string;
  description: string;
  location: Location;
  exits?: number[];
  owner?: Account;
  players?: Account[];
}

export const emptyRoom: Room = {
  index: 0,
  entityIndex: 0 as EntityIndex,
  id: '' as EntityID,
  name: '',
  description: '',
  location: { x: 0, y: 0, z: 0 },
  exits: [],
};

export interface RoomOptions {
  exits?: boolean;
  owner?: boolean;
  players?: boolean;
}

// get a Room object from its EnityIndex
export const getRoom = (network: NetworkLayer, index: EntityIndex, options?: RoomOptions): Room => {
  const {
    world,
    components: { IsAccount, AccountID, Description, Location, RoomIndex, Name },
  } = network;

  let room: Room = {
    id: world.entities[index],
    entityIndex: index,
    index: getComponentValue(RoomIndex, index)?.value as number,
    name: getComponentValue(Name, index)?.value as string,
    description: getComponentValue(Description, index)?.value as string,
    location: {
      x: getComponentValue(Location, index)?.x as number,
      y: getComponentValue(Location, index)?.y as number,
      z: getComponentValue(Location, index)?.z as number,
    },
  };

  // get the exit indices of the room
  if (options?.exits) {
    room.exits = getExits(network, room);
  }

  // if the room has an owner, include their name
  if (options?.owner && hasComponent(AccountID, index)) {
    const accountID = getComponentValue(AccountID, index)?.value as EntityID;
    const accountEntityIndex = world.entityToIndex.get(accountID) as EntityIndex;
    room.owner = getAccount(network, accountEntityIndex);
  }

  // pull players currently in room
  if (options?.players) {
    const accountResults = Array.from(
      runQuery([Has(IsAccount), HasValue(RoomIndex, { value: room.index })])
    );

    room.players = accountResults.map((accountEntityIndex) => {
      return getAccount(network, accountEntityIndex);
    });
  }

  return room;
};

// get the exits of a room (as room indices)
export const getExits = (network: NetworkLayer, room: Room): number[] => {
  const {
    components: { Exits },
  } = network;
  let exits = new Set<number>();

  // get exits based on adjacent locations
  const adjLocs = getAdjacentLocations(room.location);
  for (let i = 0; i < adjLocs.length; i++) {
    const rooms = queryRoomsX(network, { location: adjLocs[i] });
    if (rooms.length > 0) exits.add(rooms[0].index);
  }

  // get special exits
  const storedExits = getComponentValue(Exits, room.entityIndex)
    ? (getComponentValue(Exits, room.entityIndex)?.value as number[])
    : [];
  storedExits.forEach((exit) => exits.add(exit));

  return [...exits];
};

export const getAllRooms = (network: NetworkLayer, options?: RoomOptions): Room[] =>
  queryRoomsX(network, {}, options);

export const getRoomByIndex = (
  network: NetworkLayer,
  index: number,
  options?: RoomOptions
): Room => {
  const entities = queryRoomsEntitiesX(network, { index: index });
  return getRoom(network, entities[0], options);
};

/////////////////////
// QUERIES

export type QueryOptions = {
  index?: number;
  location?: Location;
};

export const queryRoomsX = (
  network: NetworkLayer,
  options: QueryOptions,
  roomOptions?: RoomOptions
): Room[] => {
  const entities = queryRoomsEntitiesX(network, options);
  return entities.map((entity) => {
    return getRoom(network, entity, roomOptions);
  });
};

// returns raw entity index
export const queryRoomsEntitiesX = (
  network: NetworkLayer,
  options: QueryOptions
): EntityIndex[] => {
  const {
    components: { Location, IsRoom, RoomIndex },
  } = network;

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

///////////////////
// UTILS

const getAdjacentLocations = (location: Location): Location[] => {
  const { x, y, z } = location;
  return [
    { x: x + 1, y, z },
    { x: x - 1, y, z },
    { x, y: y + 1, z },
    { x, y: y - 1, z },
  ];
};
