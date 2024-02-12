import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  getComponentValue,
  hasComponent,
  runQuery,
} from '@latticexyz/recs';

import { Account, getAccount } from './Account';
import { numberToHex } from 'utils/hex';
import { NetworkLayer } from 'layers/network/types';

// standardized Object shape of a Room Entity
export interface Room {
  id: EntityID;
  entityIndex: EntityIndex;
  name: string;
  description: string;
  location: number;
  exits: number[];
  owner?: Account;
  players?: Account[];
}

export interface RoomOptions {
  owner?: boolean;
  players?: boolean;
}

// get a Room object from its EnityIndex
export const getRoom = (
  network: NetworkLayer,
  index: EntityIndex,
  options?: RoomOptions
): Room => {
  const {
    world,
    components: { IsAccount, AccountID, Description, Exits, Location, Name },
  } = network;

  let room: Room = {
    id: world.entities[index],
    entityIndex: index,
    name: getComponentValue(Name, index)?.value as string,
    description: getComponentValue(Description, index)?.value as string,
    location: (getComponentValue(Location, index)?.value || (0 as number)) * 1,
    exits: getComponentValue(Exits, index)?.value as number[],
  };

  // if the room has an owner, include their name
  if (options?.owner && hasComponent(AccountID, index)) {
    const accountID = getComponentValue(AccountID, index)?.value as EntityID;
    const accountEntityIndex = world.entityToIndex.get(
      accountID
    ) as EntityIndex;
    room.owner = getAccount(network, accountEntityIndex);
  }

  // pull players currently in room
  if (options?.players) {
    const accountResults = Array.from(
      runQuery([
        Has(IsAccount),
        HasValue(Location, { value: numberToHex(room.location) }),
      ])
    );

    room.players = accountResults.map((accountEntityIndex) => {
      return getAccount(network, accountEntityIndex);
    });
  }

  // convert exits to proper numbers
  if (room.exits) room.exits = room.exits.map((exit) => exit * 1);

  return room;
};

// gets a Room Object by its location
export const getRoomByLocation = (
  network: NetworkLayer,
  location: number,
  options?: RoomOptions
): Room => {
  const roomEntityIndex = getRoomEntityIndexByLocation(network, location);
  return getRoom(network, roomEntityIndex, options);
};

export const getAllRooms = (
  network: NetworkLayer,
  options?: RoomOptions
): Room[] => {
  const { IsRoom } = network.components;
  const roomEntityIndices = Array.from(runQuery([Has(IsRoom)]));
  return roomEntityIndices.map((roomEntityIndex) => {
    return getRoom(network, roomEntityIndex, options);
  });
};

// gets a Room EntityIndex by its location
export const getRoomEntityIndexByLocation = (
  network: NetworkLayer,
  location: number
): EntityIndex => {
  const { IsRoom, Location } = network.components;
  let hexLocation = numberToHex(location);
  const roomEntityIndex = Array.from(
    runQuery([Has(IsRoom), HasValue(Location, { value: hexLocation })])
  )[0];
  return roomEntityIndex;
};
