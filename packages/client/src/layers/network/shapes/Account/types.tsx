import { EntityIndex, EntityID, getComponentValue } from '@latticexyz/recs';

import { getBonusValue } from '../Bonus';
import { getConfigFieldValue } from '../Config';
import { Kami, queryKamisX } from '../Kami';
import { GachaCommit, queryAccCommits } from '../Gacha';
import { Inventory, sortInventories, queryInventoryX } from '../Inventory';
import { LootboxLog, queryHolderLogs as queryAccLBLogs } from '../Lootbox';
import {
  Quest,
  getCompletedQuests,
  getOngoingQuests,
  parseQuestsStatus,
} from '../Quest';
import { Skill } from '../Skill/types';
import {
  Friendship,
  getAccFriends,
  getAccIncomingRequests,
  getAccOutgoingRequests,
  getAccBlocked,
} from '../Friendship';
import { getData } from '../Data';
import { NetworkLayer } from 'layers/network/types';

// standardized shape of an Account Entity
export interface Account {
  id: EntityID;
  index: number;
  entityIndex: EntityIndex;
  ownerEOA: string;
  operatorEOA: string;
  name: string;
  coin: number;
  location: number;
  level: number;
  questPoints: number;
  skillPoints: number;
  stamina: {
    total: number;
    last: number;
    recoveryPeriod: number;
  };
  time: {
    last: number;
    lastMove: number;
    creation: number;
  };
  kamis?: Kami[];
  friends?: Friends;
  gacha?: {
    commits: GachaCommit[];
  };
  inventories?: Inventories;
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

export interface Inventories {
  food: Inventory[];
  revives: Inventory[];
  gear: Inventory[];
  mods: Inventory[];
  consumables: Inventory[];
  lootboxes: Inventory[];
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
  network: NetworkLayer,
  entityIndex: EntityIndex,
  options?: AccountOptions
): Account => {
  const {
    world,
    components: {
      AccountIndex,
      Coin,
      LastActionTime,
      LastTime,
      Location,
      Name,
      OperatorAddress,
      OwnerAddress,
      QuestPoint,
      Stamina,
      StaminaCurrent,
      StartTime,
    },
  } = network;

  let account: Account = {
    entityIndex,
    id: world.entities[entityIndex],
    index: getComponentValue(AccountIndex, entityIndex)?.value as number,
    ownerEOA: getComponentValue(OwnerAddress, entityIndex)?.value as string,
    operatorEOA: getComponentValue(OperatorAddress, entityIndex)
      ?.value as string,
    name: getComponentValue(Name, entityIndex)?.value as string,
    coin: (getComponentValue(Coin, entityIndex)?.value || (0 as number)) * 1,
    location:
      (getComponentValue(Location, entityIndex)?.value || (0 as number)) * 1,
    level: 0, // placeholder
    questPoints:
      (getComponentValue(QuestPoint, entityIndex)?.value || (0 as number)) * 1,
    skillPoints: 0, // placeholder
    stamina: {
      total:
        (getComponentValue(Stamina, entityIndex)?.value || (20 as number)) * 1,
      last:
        (getComponentValue(StaminaCurrent, entityIndex)?.value ||
          (0 as number)) * 1,
      recoveryPeriod:
        getConfigFieldValue(network, 'ACCOUNT_STAMINA_RECOVERY_PERIOD') * 1,
    },
    time: {
      last: (getComponentValue(LastTime, entityIndex)?.value as number) * 1,
      lastMove:
        (getComponentValue(LastActionTime, entityIndex)?.value as number) * 1,
      creation:
        (getComponentValue(StartTime, entityIndex)?.value as number) * 1,
    },
  };

  // prevent further queries if account hasnt loaded yet
  if (!account.ownerEOA) return account;

  /////////////////
  // OPTIONAL DATA

  // populate inventories
  if (options?.inventory) {
    const inventoryResults = queryInventoryX(network, { owner: account.id });
    const foods: Inventory[] = [];
    const revives: Inventory[] = [];
    const gear: Inventory[] = [];
    const mods: Inventory[] = [];
    const consumables: Inventory[] = [];
    const lootboxes: Inventory[] = [];
    for (let i = 0; i < inventoryResults.length; i++) {
      const inventory = inventoryResults[i];
      if (inventory.item.type === 'FOOD') foods.push(inventory);
      if (inventory.item.type === 'REVIVE') revives.push(inventory);
      if (inventory.item.type === 'GEAR') gear.push(inventory);
      if (inventory.item.type === 'MOD') mods.push(inventory);
      if (inventory.item.type === 'CONSUMABLE') consumables.push(inventory);
      if (inventory.item.type === 'LOOTBOX') lootboxes.push(inventory);
    }
    sortInventories(foods);
    sortInventories(revives);
    sortInventories(gear);
    sortInventories(mods);
    sortInventories(consumables);
    sortInventories(lootboxes);

    account.inventories = {
      food: foods,
      revives: revives,
      gear: gear,
      mods: mods,
      consumables: consumables,
      lootboxes: lootboxes,
    };
  }

  // populate Kamis
  if (options?.kamis) {
    account.kamis = queryKamisX(
      network,
      { account: account.id },
      { deaths: true, production: true, traits: true }
    );
  }

  // populate Friends
  if (options?.friends) {
    account.friends = {
      friends: getAccFriends(network, account),
      incomingReqs: getAccIncomingRequests(network, account),
      outgoingReqs: getAccOutgoingRequests(network, account),
      blocked: getAccBlocked(network, account),
      limits: {
        friends:
          getConfigFieldValue(network, 'BASE_FRIENDS_LIMIT') * 1 +
          (getBonusValue(network, account.id, 'FRIENDS_LIMIT') ?? 0),
        requests: getConfigFieldValue(network, 'FRIENDS_REQUEST_LIMIT') * 1,
      },
    };
  }

  // populate Gacha
  if (options?.gacha) {
    account.gacha = { commits: queryAccCommits(network, account.id) };
  }

  // populate Quests
  if (options?.quests) {
    account.quests = {
      ongoing: parseQuestsStatus(
        network,
        account,
        getOngoingQuests(network, account.id)
      ),
      completed: parseQuestsStatus(
        network,
        account,
        getCompletedQuests(network, account.id)
      ),
    };
  }

  if (options?.lootboxLogs) {
    account.lootboxLogs = {
      unrevealed: queryAccLBLogs(network, account.id, false),
      revealed: queryAccLBLogs(network, account.id, true),
    };
  }

  // populate Stats
  if (options?.stats) {
    account.stats = {
      kills: getData(network, account.id, 'LIQUIDATE'),
      coin: getData(network, account.id, 'COIN_TOTAL'),
    };
  }

  // adjustments
  if (isNaN(account.coin)) account.coin = 0;

  return account;
};
