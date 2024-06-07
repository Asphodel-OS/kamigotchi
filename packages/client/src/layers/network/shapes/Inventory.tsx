import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  Not,
  QueryFragment,
  World,
  getComponentValue,
  runQuery,
} from '@mud-classic/recs';

import { utils } from 'ethers';
import { Components } from 'layers/network';
import { Item, getItem, getItemByIndex } from './Item';

import { MUSU_INDEX } from 'constants/indices';

//////////////
// GETTERS

export const getCoinBal = (world: World, components: Components, holderID: EntityID): number => {
  const inv = getInventoryByIndex(world, components, holderID, MUSU_INDEX);
  return inv.balance ?? 0;
};

// standardized shape of a FE Inventory Entity
export interface Inventory {
  id: EntityID;
  entityIndex: EntityIndex;
  balance?: number;
  item: Item;
}

// get an Inventory from its EntityIndex
export const getInventory = (
  world: World,
  components: Components,
  index: EntityIndex
): Inventory => {
  return getTypedInventory(world, components, index, getItem);
};

export const getTypedInventory = (
  world: World,
  components: Components,
  index: EntityIndex,
  getTypedItem: (world: World, components: Components, index: EntityIndex) => Item
): Inventory => {
  const { Value, IsRegistry, ItemIndex } = components;

  // retrieve item details based on the registry
  const itemIndex = getComponentValue(ItemIndex, index)?.value as number;
  const registryEntityIndex = Array.from(
    runQuery([Has(IsRegistry), HasValue(ItemIndex, { value: itemIndex })])
  )[0];
  const item = getTypedItem(world, components, registryEntityIndex);

  let inventory: Inventory = {
    id: world.entities[index],
    entityIndex: index,
    item: item,
  };

  inventory.balance = (getComponentValue(Value, index)?.value as number) * 1;

  return inventory;
};

/////////////////
// UTILS

// sorts a list of Inventories by their item indices
export const sortInventories = (inventories: Inventory[]) => {
  return inventories.sort((a: Inventory, b: Inventory) => (a.item.index > b.item.index ? 1 : -1));
};

// get an Inventory from a inventories of Inventories
export const getInventoryFromList = (inventories: Inventory[], index: number) => {
  if (!inventories) return;
  for (let i = 0, len = inventories.length; i < len; i++) {
    if (inventories[i].item.index === index) {
      return inventories[i];
    }
  }
};

// gets inventory by index via deterministic ID.
// @returns Inventory. If empty, returns inventory with balance 0
export const getInventoryByIndex = (
  world: World,
  components: Components,
  holderID: EntityID,
  index: number
): Inventory => {
  const entityIndex = getEntityIndex(world, holderID, index);
  if (!entityIndex)
    // inventory does not exist, return empty inventory without balance
    return {
      id: '0' as EntityID,
      entityIndex: 0 as EntityIndex,
      item: getItemByIndex(world, components, index),
      balance: 0,
    };
  else return getInventory(world, components, entityIndex);
};

const getEntityIndex = (
  world: World,
  holderID: EntityID,
  index: number
): EntityIndex | undefined => {
  const id = utils.solidityKeccak256(
    ['string', 'uint256', 'uint32'],
    ['inventory.instance', holderID ?? 0, index]
  );
  return world.entityToIndex.get(id as EntityID);
};

/////////////////
// QUERIES

export interface QueryOptions {
  owner?: EntityID;
  registry?: boolean;
  itemIndex?: number;
}

export const queryInventoryX = (
  world: World,
  components: Components,
  options: QueryOptions
): Inventory[] => {
  const { OwnsInventoryID, IsInventory, IsRegistry, ItemIndex } = components;

  const toQuery: QueryFragment[] = [Has(IsInventory)];

  if (options?.owner) {
    toQuery.push(HasValue(OwnsInventoryID, { value: options.owner }));
  }
  if (options?.itemIndex) {
    toQuery.push(HasValue(ItemIndex, { value: options.itemIndex }));
  }
  if (options?.registry !== undefined) {
    if (options?.registry) toQuery.push(Has(IsRegistry));
    else toQuery.push(Not(IsRegistry));
  }

  const raw = Array.from(runQuery(toQuery));

  return raw.map((index): Inventory => getInventory(world, components, index));
};
