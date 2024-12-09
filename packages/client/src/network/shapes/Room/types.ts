import { EntityID, EntityIndex, getComponentValue, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { Account } from '../Account';
import { Condition } from '../Conditional';
import { getRoomIndex } from '../utils/component';
import { Exit, getExitsFor } from './exit';
import { getGatesBetween } from './gate';
import { Coord, getLocation } from './utils';

// standardized Object shape of a Room Entity
export interface Room {
  index: number;
  entity: EntityIndex;
  id: EntityID;
  name: string;
  description: string;
  location: Coord;
  gates: Condition[];
  exits?: Exit[];
  players?: Account[];
  // owner?: Account; // not implemented
}

export const NullRoom: Room = {
  index: 0,
  entity: 0 as EntityIndex,
  id: '' as EntityID,
  name: '',
  description: '',
  exits: [],
  gates: [],
  location: { x: 0, y: 0, z: 0 },
};

export interface RoomOptions {
  exits?: boolean;
  // checkExits?: { account: Account }; // account to use to check gates against
  // owner?: boolean; // not implemented
}

// get a Room object from its EnityIndex
export const getRoom = (
  world: World,
  components: Components,
  entity: EntityIndex,
  options?: RoomOptions
): Room => {
  const { Description, Name } = components;
  const index = getRoomIndex(components, entity);

  let room: Room = {
    id: world.entities[entity],
    entity,
    index,
    name: getComponentValue(Name, entity)?.value as string,
    description: getComponentValue(Description, entity)?.value as string,
    location: getLocation(components, entity),
    gates: getGatesBetween(world, components, index, 0),
  };

  if (options?.exits) room.exits = getExitsFor(world, components, room);

  // // if exit check is provided an account, check gates against the account
  // if (options?.checkExits !== undefined) {
  //   room.exits = room.exits.map((exit) => {
  //     return {
  //       ...exit,
  //       blocked:
  //         options.checkExits &&
  //         !passesConditions(world, components, exit.gates, options.checkExits.account),
  //     };
  //   });
  // }

  // // if the room has an owner, include their name
  // if (options?.owner && hasComponent(AccountID, entity)) {
  //   const accountID = formatEntityID(getComponentValue(AccountID, entity)?.value ?? '');
  //   const accountEntityIndex = world.entityToIndex.get(accountID) as EntityIndex;
  //   room.owner = getAccount(world, components, accountEntityIndex);
  // }

  return room;
};
