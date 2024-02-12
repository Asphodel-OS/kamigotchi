import {
  EntityIndex,
  EntityID,
  Has,
  HasValue,
  Not,
  getComponentValue,
  runQuery,
  QueryFragment,
} from '@latticexyz/recs';

import { Item, getItem } from './Item';
import { getStats } from './Stats';
import { NetworkLayer } from 'layers/network/types';

// standardized shape of a FE Inventory Entity
export interface Inventory {
  id: EntityID;
  entityIndex: EntityIndex;
  balance?: number;
  item: Item;
}

// get an Inventory from its EntityIndex
export const getInventory = (
  network: NetworkLayer,
  index: EntityIndex
): Inventory => {
  return getTypedInventory(network, index, getItem);
};

export const getTypedInventory = (
  network: NetworkLayer,
  index: EntityIndex,
  getTypedItem: (network: NetworkLayer, index: EntityIndex) => Item
): Inventory => {
  const {
    world,
    components: { Balance, IsRegistry, ItemIndex },
  } = network;

  // retrieve item details based on the registry
  const itemIndex = getComponentValue(ItemIndex, index)?.value as number;
  const registryEntityIndex = Array.from(
    runQuery([Has(IsRegistry), HasValue(ItemIndex, { value: itemIndex })])
  )[0];
  const item = getTypedItem(network, registryEntityIndex);

  let inventory: Inventory = {
    id: world.entities[index],
    entityIndex: index,
    item: item,
  };

  // if fungible: populate the balance
  // if non-fungible: copy stats of the inventory entity over to the nested item
  if (item.isFungible) {
    inventory.balance = getComponentValue(Balance, index)?.value as number;
    inventory.balance = inventory.balance * 1;
  } else {
    inventory.item.stats = getStats(network, index);
  }

  return inventory;
};

/////////////////
// UTILS

// sorts a list of Inventories by their item indices
export const sortInventories = (inventories: Inventory[]) => {
  return inventories.sort((a: Inventory, b: Inventory) =>
    a.item.index > b.item.index ? 1 : -1
  );
};

// gets an Inventory instance from a inventories of Inventories by its Family Index
export const getInventoryByFamilyIndex = (
  inventories: Inventory[],
  familyIndex: number
) => {
  if (!inventories) return;
  for (let i = 0, len = inventories.length; i < len; i++) {
    if (inventories[i].item.familyIndex === familyIndex) {
      return inventories[i];
    }
  }
};

// get an Inventory from a inventories of Inventories
export const getInventoryByIndex = (
  inventories: Inventory[],
  index: number
) => {
  if (!inventories) return;
  for (let i = 0, len = inventories.length; i < len; i++) {
    if (inventories[i].item.index === index) {
      return inventories[i];
    }
  }
};

/////////////////
// QUERIES

export interface QueryOptions {
  owner?: EntityID;
  registry?: boolean;
  itemIndex?: number;
}

export const queryInventoryX = (
  network: NetworkLayer,
  options: QueryOptions
): Inventory[] => {
  const {
    components: { HolderID, IsInventory, IsRegistry, ItemIndex },
  } = network;

  const toQuery: QueryFragment[] = [Has(IsInventory)];

  if (options?.owner) {
    toQuery.push(HasValue(HolderID, { value: options.owner }));
  }
  if (options?.itemIndex) {
    toQuery.push(HasValue(ItemIndex, { value: options.itemIndex }));
  }
  if (options?.registry !== undefined) {
    if (options?.registry) toQuery.push(Has(IsRegistry));
    else toQuery.push(Not(IsRegistry));
  }

  const raw = Array.from(runQuery(toQuery));

  return raw.map((index): Inventory => getInventory(network, index));
};
