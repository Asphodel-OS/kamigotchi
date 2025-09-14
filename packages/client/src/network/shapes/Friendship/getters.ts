import { EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { query } from './queries';
import { Friendship, get } from './types';

// get the active Friendships for a given account
export const getAccFriends = (
  world: World,
  comps: Components,
  entity: EntityIndex,
  accOptions?: any
): Friendship[] => {
  const id = world.entities[entity];
  const entities = query(comps, { account: id, state: 'FRIEND' });
  return entities.map((entity: EntityIndex) => get(world, comps, entity, accOptions));
};

// get the incoming Friendship requests for a given Account entity
export const getAccIncomingRequests = (
  world: World,
  comps: Components,
  entity: EntityIndex,
  accOptions?: any
): Friendship[] => {
  const id = world.entities[entity];
  const entities = query(comps, { target: id, state: 'REQUEST' });
  return entities.map((entity: EntityIndex) => get(world, comps, entity, accOptions));
};

// get the outgoing Friendship requests for a given Account entity
export const getAccOutgoingRequests = (
  world: World,
  comps: Components,
  entity: EntityIndex,
  accOptions?: any
): Friendship[] => {
  const id = world.entities[entity];
  const entities = query(comps, { account: id, state: 'REQUEST' });
  return entities.map((entity: EntityIndex) => get(world, comps, entity, accOptions));
};

// get the blocked Friendships for a given account
export const getAccBlocked = (
  world: World,
  comps: Components,
  entity: EntityIndex,
  accOptions?: any
): Friendship[] => {
  const id = world.entities[entity];
  const entities = query(comps, { account: id, state: 'BLOCKED' });
  return entities.map((entity: EntityIndex) => get(world, comps, entity, accOptions));
};
