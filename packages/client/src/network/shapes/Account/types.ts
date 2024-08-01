import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';

import { MUSU_INDEX } from 'constants/items';
import { Components } from 'network/';
import { getBonusValue } from '../Bonus';
import { getConfigFieldValue } from '../Config';
import { getReputationValue } from '../Faction';
import {
  Friendship,
  getAccBlocked,
  getAccFriends,
  getAccIncomingRequests,
  getAccOutgoingRequests,
} from '../Friendship';
import { Inventory, cleanInventories, getMusuBalance, queryInventoriesByAccount } from '../Item';
import { Kami, KamiOptions, queryKamisX } from '../Kami';
import { Quest, getCompletedQuests, getOngoingQuests, parseQuestsStatus } from '../Quest';
import { Skill } from '../Skill';
import { Stat, getStat } from '../Stats';
import { getData } from '../utils';

// account shape with minimal fields
export interface BareAccount {
  id: EntityID;
  index: number;
  entityIndex: EntityIndex;
  ownerEOA: string;
  operatorEOA: string;
  name: string;
  pfpURI: string;
}

// standardized shape of an Account Entity
export interface Account extends BareAccount {
  fid: number;
  coin: number;
  roomIndex: number;
  level: number;
  reputation: {
    agency: number;
  };
  skillPoints: number;
  stamina: Stat;
  time: {
    last: number;
    lastMove: number;
    creation: number;
  };
  kamis: Kami[];
  friends?: Friends;
  inventories?: Inventory[];
  quests?: {
    ongoing: Quest[];
    completed: Quest[];
  };
  skills?: Skill[]; // unimplemented for now
  stats?: {
    kills: number;
    coin: number;
  };
}

export interface AccountOptions {
  kamis?: boolean | KamiOptions;
  friends?: boolean;
  inventory?: boolean;
  quests?: boolean;
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
  stamina: {} as Stat,
  time: {
    last: 0,
    lastMove: 0,
    creation: 0,
  },
  kamis: [],
};

export const getBareAccount = (
  world: World,
  components: Components,
  entityIndex: EntityIndex
): BareAccount => {
  const { AccountIndex, MediaURI, Name, OperatorAddress, OwnerAddress } = components;

  return {
    id: world.entities[entityIndex],
    entityIndex,
    index: getComponentValue(AccountIndex, entityIndex)?.value as number,
    operatorEOA: getComponentValue(OperatorAddress, entityIndex)?.value as string,
    ownerEOA: getComponentValue(OwnerAddress, entityIndex)?.value as string,
    pfpURI: getComponentValue(MediaURI, entityIndex)?.value as string,
    name: getComponentValue(Name, entityIndex)?.value as string,
  };
};

// get an Account from its EnityIndex
export const getAccount = (
  world: World,
  components: Components,
  entityIndex: EntityIndex,
  options?: AccountOptions
): Account => {
  const { FarcasterIndex, LastActionTime, LastTime, RoomIndex, Stamina, StartTime } = components;

  const bareAcc = getBareAccount(world, components, entityIndex);
  const id = bareAcc.id;

  let account: Account = {
    ...bareAcc,
    fid: getComponentValue(FarcasterIndex, entityIndex)?.value as number,
    coin: getMusuBalance(world, components, id),
    roomIndex: getComponentValue(RoomIndex, entityIndex)?.value as number,
    kamis: [], // placeholder
    level: 0, // placeholder
    reputation: {
      agency: getReputationValue(world, components, id, 1), // get agency rep
    },
    skillPoints: 0, // placeholder
    stamina: getStat(entityIndex, Stamina),
    time: {
      last: (getComponentValue(LastTime, entityIndex)?.value as number) * 1,
      lastMove: (getComponentValue(LastActionTime, entityIndex)?.value as number) * 1,
      creation: (getComponentValue(StartTime, entityIndex)?.value as number) * 1,
    },
  };

  // prevent further queries if account hasnt loaded yet
  if (!account.ownerEOA) return account;

  const recoveryPeriod = getConfigFieldValue(world, components, 'ACCOUNT_STAMINA_RECOVERY_PERIOD');
  account.stamina.rate = (1 / (recoveryPeriod ?? 300)) * 1;

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
    account.kamis = queryKamisX(world, components, { account: account.id }, kamiOptions);
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
          (getBonusValue(world, components, account.id, 'FRIENDS_LIMIT') ?? 0),
        requests: getConfigFieldValue(world, components, 'FRIENDS_REQUEST_LIMIT') * 1,
      },
    };
  }

  // populate Quests
  if (options?.quests) {
    account.quests = {
      ongoing: parseQuestsStatus(
        world,
        components,
        account,
        getOngoingQuests(world, components, account.id)
      ),
      completed: parseQuestsStatus(
        world,
        components,
        account,
        getCompletedQuests(world, components, account.id)
      ),
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
