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

export interface QueryOptions {
  owner?: EntityID;
  registry?: boolean;
  itemIndex?: number;
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

export const sortInventories = (list: Inventory[]) => {
  return list.sort((a: Inventory, b: Inventory) =>
    (a.item.familyIndex > b.item.familyIndex) ? 1 : -1
  );
}

export const getInventoryByFamilyIndex = (list: Inventory[], familyIndex: number) => {
  if (!list) return;
  for (let i = 0, len = list.length; i < len; i++) {
    if (list[i].item.familyIndex === familyIndex) {
      return list[i];
    }
  }
}

export const getInventoryByIndex = (list: Inventory[], index: number) => {
  if (!list) return;
  for (let i = 0, len = list.length; i < len; i++) {
    if (list[i].item.index === index) {
      return list[i];
    }
  }
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

  if (options?.registry !== undefined) {
    if (options?.registry) {
      toQuery.push(Has(IsRegistry));
    } else {
      toQuery.push(Not(IsRegistry));
    }
  }

  if (options?.itemIndex) {
    toQuery.push(HasValue(ItemIndex, { value: options.itemIndex }));
  }

  const raw = Array.from(
    runQuery(toQuery)
  );

  return raw.map(
    (index): Inventory => getInventory(layers, index)
  );
}
