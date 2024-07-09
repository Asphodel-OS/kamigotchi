import { EntityID, EntityIndex, World, getComponentValue } from '@mud-classic/recs';

import { MUSU_INDEX } from 'constants/indices';
import { Components } from 'network/';
import { getBonusValue } from '../Bonus';
import { getConfigFieldValue } from '../Config';
import { getData } from '../Data';
import { getReputationValue } from '../Faction';
import {
  Friendship,
  getAccBlocked,
  getAccFriends,
  getAccIncomingRequests,
  getAccOutgoingRequests,
} from '../Friendship';
import { queryAccCommits } from '../Gacha';
import { Inventory, cleanInventories, getCoinBal, queryInventoryX } from '../Inventory';
import { Kami, queryKamisX } from '../Kami';
import { LootboxLog, queryHolderLogs as queryAccLBLogs } from '../Lootbox';
import { Quest, getCompletedQuests, getOngoingQuests, parseQuestsStatus } from '../Quest';
import { Skill } from '../Skill';
import { Stat, getStat } from '../Stats';
import { Commit } from '../utils/Revealables';

// standardized shape of an Account Entity
export interface Account {
  id: EntityID;
  index: number;
  entityIndex: EntityIndex;
  ownerEOA: string;
  operatorEOA: string;
  fid: number;
  name: string;
  pfpURI: string;

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
  gacha?: {
    commits: Commit[];
  };
  inventories?: Inventory[];
  lootboxLogs?: {
    unrevealed: LootboxLog[];
    revealed: LootboxLog[];
  };
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
  kamis?: boolean;
  friends?: boolean;
  gacha?: boolean;
  inventory?: boolean;
  quests?: boolean;
  lootboxLogs?: boolean;
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

// get an Account from its EnityIndex
export const getAccount = (
  world: World,
  components: Components,
  entityIndex: EntityIndex,
  options?: AccountOptions
): Account => {
  const {
    AccountIndex,
    FarcasterIndex,
    LastActionTime,
    LastTime,
    MediaURI,
    RoomIndex,
    Name,
    OperatorAddress,
    OwnerAddress,
    Stamina,
    StartTime,
  } = components;

  const id = world.entities[entityIndex];

  let account: Account = {
    entityIndex,
    id: id,
    index: getComponentValue(AccountIndex, entityIndex)?.value as number,
    ownerEOA: getComponentValue(OwnerAddress, entityIndex)?.value as string,
    operatorEOA: getComponentValue(OperatorAddress, entityIndex)?.value as string,
    fid: getComponentValue(FarcasterIndex, entityIndex)?.value as number,
    pfpURI: getComponentValue(MediaURI, entityIndex)?.value as string,
    name: getComponentValue(Name, entityIndex)?.value as string,
    coin: getCoinBal(world, components, id),
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
      queryInventoryX(world, components, { owner: account.id })
    );
  }

  // populate Kamis
  if (options?.kamis) {
    account.kamis = queryKamisX(
      world,
      components,
      { account: account.id },
      { deaths: true, production: true, traits: true }
    );
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

  // populate Gacha
  if (options?.gacha) {
    account.gacha = { commits: queryAccCommits(world, components, account.id) };
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

  if (options?.lootboxLogs) {
    account.lootboxLogs = {
      unrevealed: queryAccLBLogs(world, components, account.id, false),
      revealed: queryAccLBLogs(world, components, account.id, true),
    };
  }

  // populate Stats
  if (options?.stats) {
    account.stats = {
      kills: getData(world, components, account.id, 'LIQUIDATE_TOTAL', MUSU_INDEX),
      coin: getData(world, components, account.id, 'ITEM_TOTAL', MUSU_INDEX),
    };
  }

  // adjustments
  if (isNaN(account.coin)) account.coin = 0;

  return account;
};
