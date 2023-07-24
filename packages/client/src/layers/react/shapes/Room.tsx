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

const locationToHex = (location: number) => {
  let hexLocation = location.toString(16);
  if (hexLocation.length % 2) hexLocation = '0' + hexLocation;
  return '0x' + hexLocation;
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
    location: (getComponentValue(Location, index)?.value as number) * 1,
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
        HasValue(Location, { value: locationToHex(room.location) })
      ])
    );

    room.players = accountResults.map((accountEntityIndex) => {
      return getAccount(layers, accountEntityIndex);
    });
  }

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

  let hexLocation = locationToHex(location);

  const roomEntityIndex = Array.from(
    runQuery([Has(IsRoom), HasValue(Location, { value: hexLocation })])
  )[0];

  return roomEntityIndex;
}
