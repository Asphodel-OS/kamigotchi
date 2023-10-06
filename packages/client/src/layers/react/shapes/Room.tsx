import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  getComponentValue,
  hasComponent,
  runQuery,
} from '@latticexyz/recs';

import { Layers } from 'src/types';
import { Account, getAccount } from './Account';
import { numberToHex } from 'utils/hex';

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
  layers: Layers,
  index: EntityIndex,
  options?: RoomOptions
): Room => {
  const {
    network: {
      components: {
        IsAccount,
        AccountID,
        Description,
        Exits,
        Location,
        Name,
      },
      world,
    },
  } = layers;

  let room: Room = {
    id: world.entities[index],
    entityIndex: index,
    name: getComponentValue(Name, index)?.value as string,
    description: getComponentValue(Description, index)?.value as string,
    location: (getComponentValue(Location, index)?.value || 0 as number) * 1,
    exits: getComponentValue(Exits, index)?.value as number[],
  };

  // if the room has an owner, include their name
  if (options?.owner && hasComponent(AccountID, index)) {
    const accountID = getComponentValue(AccountID, index)?.value as EntityID;
    const accountEntityIndex = world.entityToIndex.get(accountID) as EntityIndex;
    room.owner = getAccount(layers, accountEntityIndex);
  }

  // pull players currently in room
  if (options?.players) {
    const accountResults = Array.from(
      runQuery([
        Has(IsAccount),
        HasValue(Location, { value: numberToHex(room.location) })
      ])
    );

    room.players = accountResults.map((accountEntityIndex) => {
      return getAccount(layers, accountEntityIndex);
    });
  }

  // convert exits to proper numbers
  if (room.exits) room.exits = room.exits.map((exit) => exit * 1);

  return room;
};

// gets a Room Object by its location
export const getRoomByLocation = (
  layers: Layers,
  location: number,
  options?: RoomOptions
): Room => {
  const roomEntityIndex = getRoomEntityIndexByLocation(layers, location);
  return getRoom(layers, roomEntityIndex, options);
};

// gets a Room EntityIndex by its location
export const getRoomEntityIndexByLocation = (layers: Layers, location: number,): EntityIndex => {
  const {
    network: {
      components: {
        IsRoom,
        Location
      },
    },
  } = layers;

  let hexLocation = numberToHex(location);

  const roomEntityIndex = Array.from(
    runQuery([Has(IsRoom), HasValue(Location, { value: hexLocation })])
  )[0];

  return roomEntityIndex;
}
