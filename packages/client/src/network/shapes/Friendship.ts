import {
  EntityID,
  EntityIndex,
  HasValue,
  QueryFragment,
  World,
  getComponentValue,
  runQuery,
} from '@mud-classic/recs';

import { formatEntityID } from 'engine/utils';
import { Components } from 'network/';
import { Account, getAccountByID } from './Account';

export interface Friendship {
  id: EntityID;
  entity: EntityIndex;
  account: Account;
  target: Account;
  state: 'REQUEST' | 'FRIEND' | 'BLOCKED';
}

export const getFriendship = (
  world: World,
  components: Components,
  entity: EntityIndex,
  accountOptions?: any
): Friendship => {
  const { SourceID, TargetID, State } = components;

  const account = getAccountByID(
    world,
    components,
    formatEntityID(getComponentValue(SourceID, entity)?.value ?? ''),
    accountOptions
  );

  const target = getAccountByID(
    world,
    components,
    formatEntityID(getComponentValue(TargetID, entity)?.value ?? ''),
    accountOptions
  );

  return {
    id: world.entities[entity],
    entity,
    account: account,
    target: target,
    state: getComponentValue(State, entity)?.value as 'REQUEST' | 'FRIEND' | 'BLOCKED',
  };
};

/////////////////
// QUERIES

export const getAccFriends = (
  world: World,
  components: Components,
  entity: EntityIndex,
  accountOptions?: any
): Friendship[] => {
  const id = world.entities[entity];
  return queryFriendshipX(world, components, { account: id, state: 'FRIEND' }, accountOptions);
};

export const getAccIncomingRequests = (
  world: World,
  components: Components,
  entity: EntityIndex,
  accountOptions?: any
): Friendship[] => {
  const id = world.entities[entity];
  return queryFriendshipX(world, components, { target: id, state: 'REQUEST' }, accountOptions);
};

export const getAccOutgoingRequests = (
  world: World,
  components: Components,
  entity: EntityIndex,
  accountOptions?: any
): Friendship[] => {
  const id = world.entities[entity];
  return queryFriendshipX(world, components, { account: id, state: 'REQUEST' }, accountOptions);
};

export const getAccBlocked = (
  world: World,
  components: Components,
  entity: EntityIndex,
  accountOptions?: any
): Friendship[] => {
  const id = world.entities[entity];
  return queryFriendshipX(world, components, { account: id, state: 'BLOCKED' }, accountOptions);
};

export interface FriendshipOptions {
  account?: EntityID;
  target?: EntityID;
  state?: 'REQUEST' | 'FRIEND' | 'BLOCKED';
}

export const queryFriendshipX = (
  world: World,
  components: Components,
  options: FriendshipOptions,
  accountOptions?: any
): Friendship[] => {
  const { EntityType, SourceID, TargetID, State } = components;

  const toQuery: QueryFragment[] = [];
  if (options?.account) toQuery.push(HasValue(SourceID, { value: options.account }));
  if (options?.target) toQuery.push(HasValue(TargetID, { value: options.target }));
  if (options?.state) toQuery.push(HasValue(State, { value: options.state }));
  toQuery.push(HasValue(EntityType, { value: 'FRIENDSHIP' }));
  const raw = Array.from(runQuery(toQuery));

  return raw.map((index: EntityIndex) => getFriendship(world, components, index, accountOptions));
};
