import {
  EntityIndex,
  EntityID,
  Has,
  HasValue,
  getComponentValue,
  runQuery,
} from '@latticexyz/recs';

import { Layers } from 'src/types';
import { Kami, getKami } from './Kami';
import {
  Inventory,
  getInventory,
  sortInventories
} from './Inventory';

// standardized shape of an Account Entity
export interface Account {
  id: EntityID;
  ownerEOA: string;
  operatorEOA: string;
  name: string;
  coin: number;
  location: number;
  stamina: number;
  staminaCurrent: number;
  inventories?: AccountInventories;
  lastBlock: number;
  lastMoveTs: number;
  kamis?: Kami[];
}

export interface AccountOptions {
  kamis?: boolean;
  inventory?: boolean;
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
        AccountID,
        Coin,
        HolderID,
        IsInventory,
        IsPet,
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
    ownerEOA: getComponentValue(OwnerAddress, index)?.value as string,
    operatorEOA: getComponentValue(OperatorAddress, index)?.value as string,
    name: getComponentValue(Name, index)?.value as string,
    coin: getComponentValue(Coin, index)?.value as number,
    location: getComponentValue(Location, index)?.value as number,
    stamina: getComponentValue(Stamina, index)?.value as number,
    staminaCurrent: getComponentValue(StaminaCurrent, index)?.value as number,
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
    let kamis: Kami[] = [];

    const kamiResults = Array.from(
      runQuery([
        Has(IsPet),
        HasValue(AccountID, { value: account.id })
      ])
    );

    kamis = kamiResults.map(
      (index): Kami => getKami(layers, index, { production: true, traits: true })
    );
    account.kamis = kamis;
  }

  return account;
};