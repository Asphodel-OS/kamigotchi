import {
  EntityIndex,
  EntityID,
  Has,
  HasValue,
  getComponentValue,
  runQuery,
} from '@latticexyz/recs';

import { Layers } from 'src/types';
import { getConfigFieldValue } from './Config';
import { Kami, queryKamisX } from './Kami';
import { Quest, getCompletedQuests, getOngoingQuests, parseQuestsStatus } from './Quest';
import { LootboxLog, queryHolderLogs as queryAccLBLogs } from './Lootbox';
import { Skill } from './Skill';
import {
  Inventory,
  sortInventories,
  queryInventoryX,
} from './Inventory';

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
  skillPoints: number;
  stamina: {
    total: number;
    last: number;
    recoveryPeriod: number;
  };
  lastBlock: number;
  lastMoveTs: number;
  creationTs: number;
  kamis?: Kami[];
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
}

export interface Inventories {
  food: Inventory[];
  revives: Inventory[];
  gear: Inventory[];
  mods: Inventory[];
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
        LastBlock,
        LastTime,
        Location,
        Name,
        OperatorAddress,
        OwnerAddress,
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
    skillPoints: 0, // placeholder
    stamina: {
      total: getComponentValue(Stamina, entityIndex)?.value as number,
      last: getComponentValue(StaminaCurrent, entityIndex)?.value as number,
      recoveryPeriod: getConfigFieldValue(layers.network, 'ACCOUNT_STAMINA_RECOVERY_PERIOD'),
    },
    lastBlock: getComponentValue(LastBlock, entityIndex)?.value as number,
    lastMoveTs: getComponentValue(LastTime, entityIndex)?.value as number,
    creationTs: getComponentValue(StartTime, entityIndex)?.value as number,
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
    const lootboxes: Inventory[] = [];
    for (let i = 0; i < inventoryResults.length; i++) {
      const inventory = inventoryResults[i];

      if (inventory.item.type === 'FOOD') foods.push(inventory);
      if (inventory.item.type === 'REVIVE') revives.push(inventory);
      if (inventory.item.type === 'GEAR') gear.push(inventory);
      if (inventory.item.type === 'MOD') mods.push(inventory);
      if (inventory.item.type === 'LOOTBOX') lootboxes.push(inventory);
    }
    sortInventories(foods);
    sortInventories(revives);
    sortInventories(gear);
    sortInventories(mods);
    sortInventories(lootboxes);

    account.inventories = {
      food: foods,
      revives: revives,
      gear: gear,
      mods: mods,
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

// get an Account from its Username
export const getAccountByName = (layers: Layers, name: string, options?: AccountOptions) => {
  const { network: { components: { IsAccount, Name } } } = layers;
  const accountIndex = Array.from(
    runQuery([
      Has(IsAccount),
      HasValue(Name, { value: name }),
    ])
  )[0];
  return getAccount(layers, accountIndex, options);
}

// get an Account from its Operator address
export const getAccountByOperator = (
  layers: Layers,
  operatorEOA: string,
  options?: AccountOptions
) => {
  const { network: { components: { IsAccount, OperatorAddress } } } = layers;
  const accountIndex = Array.from(
    runQuery([
      Has(IsAccount),
      HasValue(OperatorAddress, { value: operatorEOA }),
    ])
  )[0];
  return getAccount(layers, accountIndex, options);
}

// get an Account from its Owner address
export const getAccountByOwner = (
  layers: Layers,
  ownerEOA: string,
  options?: AccountOptions
) => {
  const { network: { components: { IsAccount, OwnerAddress } } } = layers;
  const accountIndex = Array.from(
    runQuery([
      Has(IsAccount),
      HasValue(OwnerAddress, { value: ownerEOA }),
    ])
  )[0];
  return getAccount(layers, accountIndex, options);
}

// get an Account, assuming the currently connected burner is the Operator
export const getAccountFromBurner = (layers: Layers, options?: AccountOptions) => {
  const { network: { network } } = layers;
  return getAccountByOperator(layers, network.connectedAddress.get()!, options);
};

