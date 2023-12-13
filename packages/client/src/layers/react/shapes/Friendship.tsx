import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  QueryFragment,
  getComponentValue,
  runQuery,
} from '@latticexyz/recs';

import { Layers } from 'src/types';
import { Account, getAccountByID } from './Account';

export interface Friendship {
  id: EntityID;
  entityIndex: EntityIndex;
  account: Account;
  target: Account;
  state: "REQUEST" | "FRIEND" | "BLOCKED";
}

export const getFriendship = (
  layers: Layers,
  entityIndex: EntityIndex,
  accountPassthrough?: any
): Friendship => {
  const {
    network: {
      components: {
        AccountID,
        TargetID,
        State,
      },
      world,
    }
  } = layers;

  const account = getAccountByID(
    layers,
    getComponentValue(AccountID, entityIndex)?.value as EntityID,
    accountPassthrough
  );

  const target = getAccountByID(
    layers,
    getComponentValue(TargetID, entityIndex)?.value as EntityID,
    accountPassthrough
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
  layers: Layers,
  account: Account,
  accountPassthrough?: any,
): Friendship[] => {
  return queryFriendshipX(
    layers,
    { account: account.id, state: "FRIEND" },
    accountPassthrough
  );
}

export const getAccIncoming = (
  layers: Layers,
  account: Account,
): Friendship[] => {
  return queryFriendshipX(
    layers,
    { target: account.id, state: "REQUEST" },
  );
}

export const getAccOutgoing = (
  layers: Layers,
  account: Account,
): Friendship[] => {
  return queryFriendshipX(
    layers,
    { account: account.id, state: "REQUEST" },
  );
}

export const getAccBlocked = (
  layers: Layers,
  account: Account,
  accountPassthrough?: any,
): Friendship[] => {
  return queryFriendshipX(
    layers,
    { account: account.id, state: "BLOCKED" },
    accountPassthrough
  );
}

export interface FriendshipOptions {
  account?: EntityID;
  target?: EntityID;
  state?: "REQUEST" | "FRIEND" | "BLOCKED";
}

export const queryFriendshipX = (
  layers: Layers,
  options: any,
  accountPassthrough?: any,
): Friendship[] => {
  const {
    network: {
      components: {
        IsFriendship,
        AccountID,
        TargetID,
        State,
      },
    }
  } = layers;

  const toQuery: QueryFragment[] = [Has(IsFriendship)];

  if (options?.account)
    toQuery.push(HasValue(AccountID, { value: options.account }));

  if (options?.target)
    toQuery.push(HasValue(TargetID, { value: options.target }));

  if (options?.state)
    toQuery.push(HasValue(State, { value: options.state }));

  const raw = Array.from(runQuery(toQuery));

  return raw.map(
    (index: EntityIndex) => getFriendship(layers, index, accountPassthrough)
  );
}