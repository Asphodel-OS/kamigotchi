import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  QueryFragment,
  World,
  getComponentValue,
  runQuery,
} from '@mud-classic/recs';

import { Components } from 'network/';
import { Account, getAccountByID } from './Account';

export interface Friendship {
  id: EntityID;
  entityIndex: EntityIndex;
  account: Account;
  target: Account;
  state: 'REQUEST' | 'FRIEND' | 'BLOCKED';
}

export const getFriendship = (
  world: World,
  components: Components,
  entityIndex: EntityIndex,
  accountOptions?: any
): Friendship => {
  const { AccountID, TargetID, State } = components;

  const account = getAccountByID(
    world,
    components,
    getComponentValue(AccountID, entityIndex)?.value as EntityID,
    accountOptions
  );

  const target = getAccountByID(
    world,
    components,
    getComponentValue(TargetID, entityIndex)?.value as EntityID,
    accountOptions
  );

  return {
    id: world.entities[entityIndex],
    entityIndex: entityIndex,
    account: account,
    target: target,
    state: getComponentValue(State, entityIndex)?.value as 'REQUEST' | 'FRIEND' | 'BLOCKED',
  };
};

/////////////////
// QUERIES

export const getAccFriends = (
  world: World,
  components: Components,
  account: Account,
  accountOptions?: any
): Friendship[] => {
  return queryFriendshipX(
    world,
    components,
    { account: account.id, state: 'FRIEND' },
    accountOptions
  );
};

export const getAccIncomingRequests = (
  world: World,
  components: Components,
  account: Account
): Friendship[] => {
  return queryFriendshipX(world, components, { target: account.id, state: 'REQUEST' });
};

export const getAccOutgoingRequests = (
  world: World,
  components: Components,
  account: Account
): Friendship[] => {
  return queryFriendshipX(world, components, { account: account.id, state: 'REQUEST' });
};

export const getAccBlocked = (
  world: World,
  components: Components,
  account: Account,
  accountOptions?: any
): Friendship[] => {
  return queryFriendshipX(
    world,
    components,
    { account: account.id, state: 'BLOCKED' },
    accountOptions
  );
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
  const { IsFriendship, AccountID, TargetID, State } = components;

  const toQuery: QueryFragment[] = [Has(IsFriendship)];
  if (options?.account) toQuery.push(HasValue(AccountID, { value: options.account }));
  if (options?.target) toQuery.push(HasValue(TargetID, { value: options.target }));
  if (options?.state) toQuery.push(HasValue(State, { value: options.state }));
  const raw = Array.from(runQuery(toQuery));

  return raw.map((index: EntityIndex) => getFriendship(world, components, index, accountOptions));
};
