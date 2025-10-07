import { EntityID, EntityIndex, World } from 'engine/recs';

import { Components } from 'network/';
import { Account, AccountOptions, getAccountByID } from '../Account';
import { getSourceID, getState, getTargetID } from '../utils/component';

export type FriendState = 'REQUEST' | 'FRIEND' | 'BLOCKED';

export interface Friendship {
  id: EntityID;
  entity: EntityIndex;
  account: Account;
  target: Account;
  state: FriendState;
}

export const get = (
  world: World,
  comps: Components,
  entity: EntityIndex,
  accOptions?: AccountOptions
): Friendship => {
  const sourceID = getSourceID(comps, entity);
  const source = getAccountByID(world, comps, sourceID, accOptions);

  const targetID = getTargetID(comps, entity);
  const target = getAccountByID(world, comps, targetID, accOptions);

  return {
    id: world.entities[entity],
    entity,
    account: source,
    target: target,
    state: getState(comps, entity) as FriendState,
  };
};
