import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  QueryFragment,
  getComponentValue,
  hasComponent,
  runQuery,
} from '@latticexyz/recs';

import { NetworkLayer } from 'layers/network/types';
import { numberToHex } from 'utils/hex';
import { Account, getAccount } from './Account';

export interface Location {
  x: number;
  y: number;
  z: number;
}

// standardized Object shape of a Room Entity
export interface Room {
  id: EntityID;
  entityIndex: EntityIndex;
  index: number;
  name: string;
  description: string;
  location: Location;
  exits?: Room[];
  owner?: Account;
  players?: Account[];
}

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
    index: (getComponentValue(RoomIndex, index)?.value || (0 as number)) * 1,
    name: getComponentValue(Name, index)?.value as string,
    location: {
      x: (getComponentValue(Location, index)?.x as number) * 1,
      y: (getComponentValue(Location, index)?.y as number) * 1,
      z: (getComponentValue(Location, index)?.z as number) * 1,
    },
    description: getComponentValue(Description, index)?.value as string,
  };

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
      runQuery([Has(IsAccount), HasValue(RoomIndex, { value: numberToHex(room.index) })])
    );

    room.players = accountResults.map((accountEntityIndex) => {
      return getAccount(network, accountEntityIndex);
    });
  }

  return room;
};

export const getExits = (network: NetworkLayer, room: Room): Room[] => {
  const {
    components: { Exits },
  } = network;
  const exits: Room[] = [];

  const adjLocs = getAdjacentLocations(room.location);
  for (let i = 0; i < adjLocs.length; i++) {
    const rooms = queryRoomsX(network, { location: adjLocs[i] });
    if (rooms.length > 0) exits.push(rooms[0]);
  }

  // console.log('exits1', exits);

  const storedExits = getComponentValue(Exits, room.entityIndex)
    ? (getComponentValue(Exits, room.entityIndex)?.value as number[]).map((exit) => exit * 1)
    : [];
  // console.log('storedExits', storedExits);
  for (let i = 0; i < storedExits.length; i++) {
    const rooms = queryRoomsX(network, { index: storedExits[i] });
    if (rooms.length > 0) exits.push(rooms[0]);
  }

  // console.log('exits2', exits);

  return exits;
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

  if (options?.index) toQuery.push(HasValue(RoomIndex, { value: numberToHex(options.index) }));

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
