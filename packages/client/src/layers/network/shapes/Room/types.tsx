import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  World,
  getComponentValue,
  hasComponent,
  runQuery,
} from '@mud-classic/recs';
import { utils } from 'ethers';
import { Components } from 'layers/network';

import { Account, getAccount } from '../Account';
import { Condition, passesConditions } from '../utils/Conditionals';

import { getGatesBetween } from './functions';
import { queryRoomsEntitiesX } from './queries';

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
  exits: Exit[];
  location: Location;
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
  const { IsAccount, AccountID, Description, Exits, Location, RoomIndex, Name } = components;

  const roomIndex = getComponentValue(RoomIndex, index)?.value as number;
  const loc = {
    x: getComponentValue(Location, index)?.x as number,
    y: getComponentValue(Location, index)?.y as number,
    z: getComponentValue(Location, index)?.z as number,
  };

  const specialExits = (getComponentValue(Exits, index)?.value as number[]) || [];
  const adjExits = getAdjacentIndices(world, components, loc);
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

  // if the room has an owner, include their name
  if (options?.owner && hasComponent(AccountID, index)) {
    const accountID = getComponentValue(AccountID, index)?.value as EntityID;
    const accountEntityIndex = world.entityToIndex.get(accountID) as EntityIndex;
    room.owner = getAccount(world, components, accountEntityIndex);
  }

  // pull players currently in room
  if (options?.players) {
    const accountResults = Array.from(
      runQuery([Has(IsAccount), HasValue(RoomIndex, { value: room.index })])
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

///////////////////
// UTILS

export const getGateToPtr = (index: number): EntityID => {
  return utils.solidityKeccak256(['string', 'uint32'], ['room.gate.to', index]) as EntityID;
};

export const getGateFromPtr = (index: number): EntityID => {
  return utils.solidityKeccak256(['string', 'uint32'], ['room.gate.from', index]) as EntityID;
};

const getAdjacentIndices = (world: World, components: Components, location: Location): number[] => {
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

const getAdjacentLocations = (location: Location): Location[] => {
  const { x, y, z } = location;
  return [
    { x: x + 1, y, z },
    { x: x - 1, y, z },
    { x, y: y + 1, z },
    { x, y: y - 1, z },
  ];
};
