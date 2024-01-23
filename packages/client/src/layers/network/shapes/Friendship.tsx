import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  QueryFragment,
  getComponentValue,
  runQuery,
} from '@latticexyz/recs';

import { Account, getAccountByID } from './Account';
import { NetworkLayer } from 'layers/network/types';


export interface Friendship {
  id: EntityID;
  entityIndex: EntityIndex;
  account: Account;
  target: Account;
  state: "REQUEST" | "FRIEND" | "BLOCKED";
}

export const getFriendship = (
  network: NetworkLayer,
  entityIndex: EntityIndex,
  accountOptions?: any
): Friendship => {
  const {
    world,
    components: {
      AccountID,
      TargetID,
      State,
    },
  } = network;

  const account = getAccountByID(
    network,
    getComponentValue(AccountID, entityIndex)?.value as EntityID,
    accountOptions
  );

  const target = getAccountByID(
    network,
    getComponentValue(TargetID, entityIndex)?.value as EntityID,
    accountOptions
  );

  return {
    id: world.entities[entityIndex],
    entityIndex: entityIndex,
    account: account,
    target: target,
    state: getComponentValue(State, entityIndex)?.value as "REQUEST" | "FRIEND" | "BLOCKED",
  }
}

/////////////////
// QUERIES

export const getAccFriends = (
  network: NetworkLayer,
  account: Account,
  accountOptions?: any,
): Friendship[] => {
  return queryFriendshipX(
    network,
    { account: account.id, state: "FRIEND" },
    accountOptions
  );
}

export const getAccIncomingRequests = (
  network: NetworkLayer,
  account: Account,
): Friendship[] => {
  return queryFriendshipX(
    network,
    { target: account.id, state: "REQUEST" },
  );
}

export const getAccOutgoingRequests = (
  network: NetworkLayer,
  account: Account,
): Friendship[] => {
  return queryFriendshipX(
    network,
    { account: account.id, state: "REQUEST" },
  );
}

export const getAccBlocked = (
  network: NetworkLayer,
  account: Account,
  accountOptions?: any,
): Friendship[] => {
  return queryFriendshipX(
    network,
    { account: account.id, state: "BLOCKED" },
    accountOptions
  );
}

export interface FriendshipOptions {
  account?: EntityID;
  target?: EntityID;
  state?: "REQUEST" | "FRIEND" | "BLOCKED";
}

export const queryFriendshipX = (
  network: NetworkLayer,
  options: FriendshipOptions,
  accountOptions?: any,
): Friendship[] => {
  const {
    components: {
      IsFriendship,
      AccountID,
      TargetID,
      State,
    },
  } = network;

  const toQuery: QueryFragment[] = [Has(IsFriendship)];

  if (options?.account)
    toQuery.push(HasValue(AccountID, { value: options.account }));

  if (options?.target)
    toQuery.push(HasValue(TargetID, { value: options.target }));

  if (options?.state)
    toQuery.push(HasValue(State, { value: options.state }));

  const raw = Array.from(runQuery(toQuery));

  return raw.map(
    (index: EntityIndex) => getFriendship(network, index, accountOptions)
  );
}