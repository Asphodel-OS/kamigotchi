import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  Not,
  QueryFragment,
  World,
  runQuery,
} from '@mud-classic/recs';

import { MUSU_INDEX } from 'constants/indices';
import { Components } from 'network/components';
import { Inventory, Item, LootboxLog, getInventory, getItem, getLootboxLog } from './types';
import { getInventoryEntityIndex } from './utils';

/////////////////
// ITEMS

/**
 * get an item in the registry by index
 * @param world - the world object
 * @param components - the list (as object) of registered components in the world
 * @param index - the item index of the registry instance
 */

export const getItemByIndex = (world: World, components: Components, index: number): Item => {
  const { IsRegistry, ItemIndex } = components;
  const entityIndices = Array.from(
    runQuery([Has(IsRegistry), HasValue(ItemIndex, { value: index })])
  );
  return getItem(world, components, entityIndices[0]);
};

// get all items in the registry
export const getAllItems = (world: World, components: Components): Item[] => {
  const { IsRegistry, ItemIndex } = components;
  const entityIndices = Array.from(runQuery([Has(IsRegistry), Has(ItemIndex)]));
  return entityIndices.map((entityIndex) => getItem(world, components, entityIndex));
};

/////////////////
// INVENTORY

// gets inventory by deterministic ID using the holder's ID and the item index.
// @returns Inventory. If empty, returns inventory with balance 0
export const getInventoryByHolderItem = (
  world: World,
  components: Components,
  holderID: EntityID,
  itemIndex: number
): Inventory => {
  const entityIndex = getInventoryEntityIndex(world, holderID, itemIndex);
  if (!entityIndex)
    // inventory does not exist, return empty inventory without balance
    return {
      id: '0' as EntityID,
      entityIndex: 0 as EntityIndex,
      item: getItemByIndex(world, components, itemIndex),
      balance: 0,
    };
  else return getInventory(world, components, entityIndex);
};

// gets the musu balance of a holding account
export const getMusuBalance = (
  world: World,
  components: Components,
  holderID: EntityID
): number => {
  const inv = getInventoryByHolderItem(world, components, holderID, MUSU_INDEX);
  return inv.balance ?? 0;
};

// get all inventories owned by an account
export const queryInventoriesByAccount = (
  world: World,
  components: Components,
  accountID: EntityID
) => {
  return queryInventories(world, components, { owner: accountID });
};

interface InventoryQueryOptions {
  owner?: EntityID;
  itemIndex?: number;
  registry?: boolean;
}

export const queryInventories = (
  world: World,
  components: Components,
  options: InventoryQueryOptions
): Inventory[] => {
  const { OwnsInventoryID, IsInventory, IsRegistry, ItemIndex } = components;

  const toQuery: QueryFragment[] = [Has(IsInventory)];
  if (options?.owner) toQuery.push(HasValue(OwnsInventoryID, { value: options.owner }));
  if (options?.itemIndex) toQuery.push(HasValue(ItemIndex, { value: options.itemIndex }));
  if (options?.registry !== undefined) {
    if (options?.registry) toQuery.push(Has(IsRegistry));
    else toQuery.push(Not(IsRegistry));
  }

  const raw = Array.from(runQuery(toQuery));
  return raw.map((index): Inventory => getInventory(world, components, index));
};

/////////////////
// LOOTBOX LOGS

export const queryLootboxLogsByHolder = (
  world: World,
  components: Components,
  holderID: EntityID,
  revealed: boolean
): LootboxLog[] => {
  const { IsLootbox, IsLog, HolderID, RevealBlock } = components;

  const toQuery: QueryFragment[] = [
    Has(IsLootbox),
    Has(IsLog),
    HasValue(HolderID, { value: holderID }),
  ];

  if (revealed) toQuery.push(Not(RevealBlock));
  else toQuery.push(Has(RevealBlock));

  const entityIndices = Array.from(runQuery(toQuery));

  return entityIndices.map((index) => getLootboxLog(world, components, index));
};
