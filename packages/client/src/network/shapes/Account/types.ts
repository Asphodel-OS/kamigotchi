import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';

import { MUSU_INDEX } from 'constants/items';
import { Components } from 'network/';
import { getBonusValue } from '../Bonus';
import { getConfigFieldValue } from '../Config';
import { getReputation } from '../Faction';
import {
  Friendship,
  getAccBlocked,
  getAccFriends,
  getAccIncomingRequests,
  getAccOutgoingRequests,
} from '../Friendship';
import { Inventory, cleanInventories, getMusuBalance, queryInventoriesByAccount } from '../Item';
import { Kami, KamiOptions, getKamisByAccount } from '../Kami';
import { Skill } from '../Skill';
import { getData } from '../utils';

// account shape with minimal fields
export interface BaseAccount {
  ObjectType: string;
  id: EntityID;
  index: number;
  entityIndex: EntityIndex;
  ownerEOA: string;
  operatorEOA: string;
  name: string;
  pfpURI: string;
}

// standardized shape of an Account Entity
export interface Account extends BaseAccount {
  fid: number;
  coin: number;
  roomIndex: number;
  level: number;
  reputation: {
    agency: number;
  };
  skillPoints: number;
  time: {
    last: number;
    creation: number;
  };
  kamis: Kami[];
  friends?: Friends;
  inventories?: Inventory[];
  skills?: Skill[]; // unimplemented for now
  stats?: {
    kills: number;
    coin: number;
  };
}

export interface Options {
  friends?: boolean;
  inventory?: boolean;
  kamis?: boolean | KamiOptions;
  stats?: boolean;
}

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

export const NullAccount: Account = {
  ObjectType: 'ACCOUNT',
  id: '0' as EntityID,
  entityIndex: 0 as EntityIndex,
  index: 0,
  operatorEOA: '',
  ownerEOA: '',
  fid: 0,
  name: '',
  pfpURI: '',

  coin: 0,
  roomIndex: 0,
  level: 0,
  reputation: {
    agency: 0,
  },
  skillPoints: 0,
  time: {
    last: 0,
    creation: 0,
  },
  kamis: [],
};

// get a BaseAccount from its EntityIndex
export const getBaseAccount = (
  world: World,
  components: Components,
  entity: EntityIndex
): BaseAccount => {
  const { AccountIndex, MediaURI, Name, OperatorAddress, OwnerAddress } = components;

  return {
    ObjectType: 'ACCOUNT',
    id: world.entities[entity],
    entityIndex: entity,
    index: getComponentValue(AccountIndex, entity)?.value as number,
    operatorEOA: getComponentValue(OperatorAddress, entity)?.value as string,
    ownerEOA: getComponentValue(OwnerAddress, entity)?.value as string,
    pfpURI: getComponentValue(MediaURI, entity)?.value as string,
    name: getComponentValue(Name, entity)?.value as string,
  };
};

// get an Account from its EnityIndex
export const getAccount = (
  world: World,
  components: Components,
  entity: EntityIndex,
  options?: Options
): Account => {
  const { FarcasterIndex, LastTime, RoomIndex, StartTime } = components;

  const bareAcc = getBaseAccount(world, components, entity);
  const id = bareAcc.id;

  let account: Account = {
    ...bareAcc,
    fid: getComponentValue(FarcasterIndex, entity)?.value as number,
    coin: getMusuBalance(world, components, id),
    roomIndex: getComponentValue(RoomIndex, entity)?.value as number,
    kamis: [], // placeholder
    level: 0, // placeholder
    reputation: {
      agency: getReputation(world, components, id, 1), // get agency rep
    },
    skillPoints: 0, // placeholder
    time: {
      last: (getComponentValue(LastTime, entity)?.value as number) * 1,
      creation: (getComponentValue(StartTime, entity)?.value as number) * 1,
    },
  };

  // prevent further queries if account hasnt loaded yet, with empty optionals
  if (!account.ownerEOA) {
    return {
      ...account,
      friends: {
        friends: [],
        incomingReqs: [],
        outgoingReqs: [],
        blocked: [],
        limits: { friends: 0, requests: 0 },
      },
      inventories: [],
      skills: [],
      stats: {
        kills: 0,
        coin: 0,
      },
    };
  }

  /////////////////
  // OPTIONAL DATA

  // populate inventories
  if (options?.inventory) {
    account.inventories = cleanInventories(
      queryInventoriesByAccount(world, components, account.id)
    );
  }

  // populate Kamis
  if (options?.kamis) {
    const kamiOptions = typeof options.kamis === 'boolean' ? {} : options.kamis;
    account.kamis = getKamisByAccount(world, components, account.id, kamiOptions);
  }

  // populate Friends
  if (options?.friends) {
    account.friends = {
      friends: getAccFriends(world, components, account),
      incomingReqs: getAccIncomingRequests(world, components, account),
      outgoingReqs: getAccOutgoingRequests(world, components, account),
      blocked: getAccBlocked(world, components, account),
      limits: {
        friends:
          getConfigFieldValue(world, components, 'BASE_FRIENDS_LIMIT') * 1 +
          (getBonusValue(world, components, 'FRIENDS_LIMIT', account.id) ?? 0),
        requests: getConfigFieldValue(world, components, 'FRIENDS_REQUEST_LIMIT') * 1,
      },
    };
  }

  // populate Stats
  if (options?.stats) {
    account.stats = {
      kills: getData(world, components, account.id, 'LIQUIDATE_TOTAL', 0),
      coin: getData(world, components, account.id, 'ITEM_TOTAL', MUSU_INDEX),
    };
  }

  return account;
};
