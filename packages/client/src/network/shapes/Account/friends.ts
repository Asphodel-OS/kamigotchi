import { EntityIndex, World } from '@mud-classic/recs';
import { Components } from 'network/components';
import { getBonusValue } from '../Bonus';
import { getConfigFieldValue } from '../Config';
import {
  Friendship,
  getAccBlocked,
  getAccFriends,
  getAccIncomingRequests,
  getAccOutgoingRequests,
} from '../Friendship';

export interface Friends {
  friends: Friendship[];
  incomingReqs: Friendship[];
  outgoingReqs: Friendship[];
  blocked: Friendship[];
  limits: {
    friends: number;
    requests: number;
  };
}

export const getFriends = (world: World, components: Components, entity: EntityIndex) => {
  const id = world.entities[entity];
  return {
    friends: getAccFriends(world, components, entity),
    incomingReqs: getAccIncomingRequests(world, components, entity),
    outgoingReqs: getAccOutgoingRequests(world, components, entity),
    blocked: getAccBlocked(world, components, entity),
    limits: {
      friends:
        getConfigFieldValue(world, components, 'BASE_FRIENDS_LIMIT') * 1 +
        (getBonusValue(world, components, 'FRIENDS_LIMIT', id) ?? 0),
      requests: getConfigFieldValue(world, components, 'FRIENDS_REQUEST_LIMIT') * 1,
    },
  };
};
