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
import {
  Inventory,
  getInventory,
  sortInventories
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
  stamina: number;
  staminaCurrent: number;
  staminaRecoveryPeriod: number;
  lastBlock: number;
  lastMoveTs: number;
  kamis?: Kami[];
  inventories?: AccountInventories;
  quests?: {
    ongoing: Quest[];
    completed: Quest[];
  }
}

export interface AccountOptions {
  kamis?: boolean;
  inventory?: boolean;
  quests?: boolean;
}

// bucketed inventory slots
export interface AccountInventories {
  food: Inventory[];
  revives: Inventory[];
  gear: Inventory[];
  mods: Inventory[];
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
    coin: getComponentValue(Coin, index)?.value as number,
    location: getComponentValue(Location, index)?.value as number,
    // stamina: {
    //   total: getComponentValue(Stamina, index)?.value as number,
    //   last: getComponentValue(StaminaCurrent, index)?.value as number,
    //   recoveryPeriod: 1, // dummy value
    // },
    stamina: getComponentValue(Stamina, index)?.value as number,
    staminaCurrent: getComponentValue(StaminaCurrent, index)?.value as number,
    staminaRecoveryPeriod: 1, // dummy value
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
    let inventories: AccountInventories = {
      food: [],
      revives: [],
      gear: [],
      mods: [],
    };
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


  /////////////////
  // ADJUSTMENTS

  const staminaRecoveryPeriod = getConfigFieldValue(layers.network, 'ACCOUNT_STAMINA_RECOVERY_PERIOD');
  account.staminaRecoveryPeriod = staminaRecoveryPeriod;

  return account;
};


export const getAccountFromBurner = (layers: Layers, options?: AccountOptions) => {
  const {
    network: {
      network,
      components: {
        IsAccount,
        OperatorAddress,
      },
    },
  } = layers;

  const accountIndex = Array.from(
    runQuery([
      Has(IsAccount),
      HasValue(OperatorAddress, {
        value: network.connectedAddress.get(),
      }),
    ])
  )[0];

  return getAccount(layers, accountIndex, options);
};