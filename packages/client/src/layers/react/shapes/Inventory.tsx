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

import { Layers } from 'src/types';
import { Item, getItem } from './Item';
import { getStats } from './Stats';

// standardized shape of a FE Inventory Entity
export interface Inventory {
  id: EntityID;
  entityIndex: EntityIndex;
  balance?: number;
  item: Item;
}

// get an Inventory from its EntityIndex
export const getInventory = (
  layers: Layers,
  index: EntityIndex,
): Inventory => {
  const {
    network: {
      world,
      components: {
        Balance,
        IsRegistry,
        ItemIndex,
      },
    },
  } = layers;

  // retrieve item details based on the registry
  const itemIndex = getComponentValue(ItemIndex, index)?.value as number;
  const registryEntityIndex = Array.from(
    runQuery([
      Has(IsRegistry),
      HasValue(ItemIndex, { value: itemIndex }),
    ])
  )[0];
  const item = getItem(layers, registryEntityIndex);

  let inventory: Inventory = {
    id: world.entities[index],
    entityIndex: index,
    item: item,
  }

  // if fungible: populate the balance
  // if non-fungible: copy stats of the inventory entity over to the nested item
  if (item.isFungible) {
    inventory.balance = getComponentValue(Balance, index)?.value as number;
    inventory.balance = inventory.balance * 1;
  } else {
    inventory.item.stats = getStats(layers, index);
  }

  return inventory;
}


/////////////////
// UTILS

export interface AccountInventories {
  food: Inventory[];
  revives: Inventory[];
  gear: Inventory[];
  mods: Inventory[];
}

// create an empty instance of account inventories
export const newAccountInventories = (): AccountInventories => ({
  food: [],
  revives: [],
  gear: [],
  mods: [],
});


// sorts a list of Inventories by their Family Indices (e.g. foodIndex, reviveIndex)
export const sortInventories = (inventories: Inventory[]) => {
  return inventories.sort((a: Inventory, b: Inventory) =>
    (a.item.familyIndex > b.item.familyIndex) ? 1 : -1
  );
}

// gets an Inventory instance from a inventories of Inventories by its Family Index
export const getInventoryByFamilyIndex = (inventories: Inventory[], familyIndex: number) => {
  if (!inventories) return;
  for (let i = 0, len = inventories.length; i < len; i++) {
    if (inventories[i].item.familyIndex === familyIndex) {
      return inventories[i];
    }
  }
}

// get an Inventory from a inventories of Inventories
export const getInventoryByIndex = (inventories: Inventory[], index: number) => {
  if (!inventories) return;
  for (let i = 0, len = inventories.length; i < len; i++) {
    if (inventories[i].item.index === index) {
      return inventories[i];
    }
  }
}


/////////////////
// QUERIES

export interface QueryOptions {
  owner?: EntityID;
  registry?: boolean;
  itemIndex?: number;
}

export const queryInventoryX = (
  layers: Layers,
  options: QueryOptions
): Inventory[] => {
  const {
    network: {
      components: {
        IsInventory,
        IsRegistry,
        ItemIndex,
        HolderID,
      },
    },
  } = layers;

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

  return raw.map(
    (index): Inventory => getInventory(layers, index)
  );
}
