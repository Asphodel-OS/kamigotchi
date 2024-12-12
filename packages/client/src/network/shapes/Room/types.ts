import {
  EntityID,
  EntityIndex,
  HasValue,
  World,
  getComponentValue,
  runQuery,
} from '@mud-classic/recs';
import { Components } from 'network/';

import { Account, getAccount } from '../Account';
import { Condition, passesConditions } from '../Conditional';

import { hashArgs } from '../utils';
import { getGatesBetween } from './functions';
import { queryRoomsEntitiesX } from './queries';

export interface Coord {
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
  exits: Exit[];
  location: Coord;
  owner?: Account;
  players?: Account[];
}

export interface Exit {
  toIndex: number;
  fromIndex: number;
  gates: Condition[];
  blocked?: boolean;
}

export const emptyRoom: Room = {
  index: 0,
  entityIndex: 0 as EntityIndex,
  id: '' as EntityID,
  name: '',
  description: '',
  exits: [],
  location: { x: 0, y: 0, z: 0 },
};

export interface RoomOptions {
  checkExits?: { account: Account }; // account to use to check gates against
  owner?: boolean;
  players?: boolean;
}

// get a Room object from its EnityIndex
export const getRoom = (
  world: World,
  components: Components,
  index: EntityIndex,
  options?: RoomOptions
): Room => {
  const { Description, EntityType, Exits, RoomIndex, Name } = components;

  const roomIndex = getComponentValue(RoomIndex, index)?.value as number;
  const loc = getLocation(components, index);

  const specialExits = (getComponentValue(Exits, index)?.value as number[]) || [];
  const adjExits = getAdjacentIndices(components, loc);
  const rawExits = [...specialExits, ...adjExits];

  let room: Room = {
    id: world.entities[index],
    entityIndex: index,
    index: roomIndex,
    name: getComponentValue(Name, index)?.value as string,
    description: getComponentValue(Description, index)?.value as string,
    exits: rawExits.map((toIndex) => getExit(world, components, toIndex, roomIndex)),
    location: loc,
  };

  // if exit check is provided an account, check gates against the account
  if (options?.checkExits !== undefined) {
    room.exits = room.exits.map((exit) => {
      return {
        ...exit,
        blocked:
          options.checkExits &&
          !passesConditions(world, components, exit.gates, options.checkExits.account),
      };
    });
  }

  // // if the room has an owner, include their name
  // if (options?.owner && hasComponent(AccountID, index)) {
  //   const accountID = formatEntityID(getComponentValue(AccountID, index)?.value ?? '');
  //   const accountEntityIndex = world.entityToIndex.get(accountID) as EntityIndex;
  //   room.owner = getAccount(world, components, accountEntityIndex);
  // }

  // pull players currently in room
  if (options?.players) {
    const accountResults = Array.from(
      runQuery([
        HasValue(RoomIndex, { value: room.index }),
        HasValue(EntityType, { value: 'ACCOUNT' }),
      ])
    );

    room.players = accountResults.map((accountEntityIndex) => {
      return getAccount(world, components, accountEntityIndex);
    });
  }

  return room;
};

const getExit = (
  world: World,
  components: Components,
  toIndex: number,
  fromIndex: number
): Exit => {
  return {
    toIndex,
    fromIndex,
    gates: getGatesBetween(world, components, toIndex, fromIndex),
  };
};

const getLocation = (components: Components, index: EntityIndex): Coord => {
  const { Location } = components;
  return bigIntToCoord(BigInt(getComponentValue(Location, index)?.value || 0));
};

///////////////////
// UTILS

export const getGateToPtr = (index: number): EntityID => {
  return hashArgs(['room.gate.to', index], ['string', 'uint32']);
};

export const getGateFromPtr = (index: number): EntityID => {
  return hashArgs(['room.gate.from', index], ['string', 'uint32']);
};

const getAdjacentIndices = (components: Components, location: Coord): number[] => {
  const { RoomIndex } = components;

  const results: number[] = [];
  const adjLocs = getAdjacentLocations(location);
  for (let i = 0; i < adjLocs.length; i++) {
    const ids = queryRoomsEntitiesX(components, { location: adjLocs[i] });

    if (ids.length > 0) {
      // room exists at location, add index to results
      results.push((getComponentValue(RoomIndex, ids[0])?.value || 0) * 1);
    }
  }

  return results;
};

const getAdjacentLocations = (location: Coord): Coord[] => {
  const { x, y, z } = location;
  return [
    { x: x + 1, y, z },
    { x: x - 1, y, z },
    { x, y: y + 1, z },
    { x, y: y - 1, z },
  ];
};

export const coordToBigInt = (value: Coord): bigint => {
  return (BigInt(value.x) << 128n) | (BigInt(value.y) << 64n) | BigInt(value.z);
};

export const bigIntToCoord = (value: bigint): Coord => {
  return {
    x: Number(value >> 128n),
    y: Number((value >> 64n) & 0xffffffffffffffffn),
    z: Number(value & 0xffffffffffffffffn),
  };
};
