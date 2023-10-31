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
import { Skill } from './Skill';
import {
  AccountInventories,
  Inventory,
  getInventory,
  newAccountInventories,
  sortInventories,
} from './Inventory';

// standardized shape of an Account Entity
export interface Account {
  id: EntityID;
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
  kamis?: Kami[];
  inventories?: AccountInventories;
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
}

// get an Account from its EnityIndex
export const getAccount = (
  layers: Layers,
  index: EntityIndex,
  options?: AccountOptions
): Account => {
  const {
    network: {
      world,
      components: {
        Coin,
        HolderID,
        IsInventory,
        LastBlock,
        LastTime,
        Location,
        Name,
        OperatorAddress,
        OwnerAddress,
        Stamina,
        StaminaCurrent
      },
    },
  } = layers;

  let account: Account = {
    id: world.entities[index],
    entityIndex: index,
    ownerEOA: getComponentValue(OwnerAddress, index)?.value as string,
    operatorEOA: getComponentValue(OperatorAddress, index)?.value as string,
    name: getComponentValue(Name, index)?.value as string,
    coin: (getComponentValue(Coin, index)?.value as number) * 1,
    location: (getComponentValue(Location, index)?.value || 0 as number) * 1,
    level: 0, // placeholder
    skillPoints: 0, // placeholder
    stamina: {
      total: getComponentValue(Stamina, index)?.value as number,
      last: getComponentValue(StaminaCurrent, index)?.value as number,
      recoveryPeriod: getConfigFieldValue(layers.network, 'ACCOUNT_STAMINA_RECOVERY_PERIOD'),
    },
    lastBlock: getComponentValue(LastBlock, index)?.value as number,
    lastMoveTs: getComponentValue(LastTime, index)?.value as number,
  };


  /////////////////
  // OPTIONAL DATA

  // populate inventories
  if (options?.inventory) {
    const inventoryResults = Array.from(
      runQuery([
        Has(IsInventory),
        HasValue(HolderID, { value: account.id })
      ])
    );

    let inventory: Inventory;
    let inventories = newAccountInventories();
    for (let i = 0; i < inventoryResults.length; i++) {
      inventory = getInventory(layers, inventoryResults[i]);
      if (inventory.item.type === 'FOOD') inventories.food.push(inventory);
      if (inventory.item.type === 'REVIVE') inventories.revives.push(inventory);
      if (inventory.item.type === 'GEAR') inventories.gear.push(inventory);
      if (inventory.item.type === 'MOD') inventories.mods.push(inventory);
    }

    sortInventories(inventories.food);
    sortInventories(inventories.revives);
    sortInventories(inventories.gear);
    sortInventories(inventories.mods);
    account.inventories = inventories;
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

  return account;
};

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