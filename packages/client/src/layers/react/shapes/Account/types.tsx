import {
  EntityIndex,
  EntityID,
  getComponentValue,
} from '@latticexyz/recs';

import { Layers } from 'src/types';
import { getConfigFieldValue } from '../Config';
import { Kami, queryKamisX } from '../Kami';
import { Inventory, sortInventories, queryInventoryX } from '../Inventory';
import { LootboxLog, queryHolderLogs as queryAccLBLogs } from '../Lootbox';
import { Quest, getCompletedQuests, getOngoingQuests, parseQuestsStatus } from '../Quest';
import { Skill } from '../Skill';
import { Friendship, getAccFriends, getAccIncomingRequests, getAccOutgoingRequests, getAccBlocked } from '../Friendship';


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
  }
  kamis?: Kami[];
  friends?: {
    friends: Friendship[];
    incomingReqs: Friendship[];
    outgoingReqs: Friendship[];
    blocked: Friendship[];
  }
  inventories?: Inventories;
  lootboxLogs?: {
    unrevealed: LootboxLog[];
    revealed: LootboxLog[];
  }
  quests?: {
    ongoing: Quest[];
    completed: Quest[];
  }
  skills?: Skill[]; // unimplemented for now
}

export interface AccountOptions {
  kamis?: boolean;
  inventory?: boolean;
  quests?: boolean;
  lootboxLogs?: boolean;
  friends?: boolean;
}

export interface Inventories {
  food: Inventory[];
  revives: Inventory[];
  gear: Inventory[];
  mods: Inventory[];
  consumables: Inventory[];
  lootboxes: Inventory[];
}

// get an Account from its EnityIndex
export const getAccount = (
  layers: Layers,
  entityIndex: EntityIndex,
  options?: AccountOptions
): Account => {
  const {
    network: {
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
    },
  } = layers;

  let account: Account = {
    entityIndex,
    id: world.entities[entityIndex],
    index: getComponentValue(AccountIndex, entityIndex)?.value as number,
    ownerEOA: getComponentValue(OwnerAddress, entityIndex)?.value as string,
    operatorEOA: getComponentValue(OperatorAddress, entityIndex)?.value as string,
    name: getComponentValue(Name, entityIndex)?.value as string,
    coin: (getComponentValue(Coin, entityIndex)?.value as number) * 1,
    location: (getComponentValue(Location, entityIndex)?.value || 0 as number) * 1,
    level: 0, // placeholder
    questPoints: (getComponentValue(QuestPoint, entityIndex)?.value || 0) * 1 as number,
    skillPoints: 0, // placeholder
    stamina: {
      total: (getComponentValue(Stamina, entityIndex)?.value as number) * 1,
      last: (getComponentValue(StaminaCurrent, entityIndex)?.value as number) * 1,
      recoveryPeriod: (getConfigFieldValue(layers.network, 'ACCOUNT_STAMINA_RECOVERY_PERIOD')) * 1,
    },
    time: {
      last: (getComponentValue(LastTime, entityIndex)?.value as number) * 1,
      lastMove: (getComponentValue(LastActionTime, entityIndex)?.value as number) * 1,
      creation: (getComponentValue(StartTime, entityIndex)?.value as number) * 1,
    }
  };

  // prevent queries account hasnt loaded yet
  if (!account.ownerEOA) return account;

  /////////////////
  // OPTIONAL DATA

  // populate inventories
  if (options?.inventory) {
    const inventoryResults = queryInventoryX(layers, { owner: account.id });
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
    }
  }

  // populate Kamis
  if (options?.kamis) {
    account.kamis = queryKamisX(
      layers,
      { account: account.id },
      { deaths: true, production: true, traits: true }
    );
  }

  // populate Friends
  if (options?.friends) {
    account.friends = {
      friends: getAccFriends(layers, account),
      incomingReqs: getAccIncomingRequests(layers, account),
      outgoingReqs: getAccOutgoingRequests(layers, account),
      blocked: getAccBlocked(layers, account),
    }
  }

  // populate Quests
  if (options?.quests) {
    account.quests = {
      ongoing: parseQuestsStatus(layers, account, getOngoingQuests(layers, account.id)),
      completed: parseQuestsStatus(layers, account, getCompletedQuests(layers, account.id)),
    }
  }

  if (options?.lootboxLogs) {
    account.lootboxLogs = {
      unrevealed: queryAccLBLogs(layers, account.id, false),
      revealed: queryAccLBLogs(layers, account.id, true)
    }
  }

  // adjustments
  if (isNaN(account.coin)) account.coin = 0;

  return account;
};

