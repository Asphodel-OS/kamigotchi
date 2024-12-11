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

import { Components } from 'network/components';
import { DetailedEntity } from '../utils';
import {
  Inventory,
  Item,
  NullItem,
  getInventory,
  getItem,
  getItemDetails,
  getRegEntityIndex,
} from './types';
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
  const entityIndex = getItemRegEntity(world, index);
  return entityIndex ? getItem(world, components, entityIndex) : NullItem;
};

export const getItemDetailsByIndex = (
  world: World,
  components: Components,
  index: number
): DetailedEntity => {
  const entityIndex = getItemRegEntity(world, index);
  return entityIndex ? getItemDetails(components, entityIndex) : NullItem;
};

export const getItemRegEntity = (world: World, index: number): EntityIndex | undefined => {
  const entityIndex = getRegEntityIndex(world, index);
  // if (!entityIndex) console.warn('Item registry not found');
  return entityIndex;
};

// get all items in the registry
export const getAllItems = (world: World, components: Components): Item[] => {
  const { IsRegistry, EntityType } = components;
  const entityIndices = Array.from(
    runQuery([Has(IsRegistry), HasValue(EntityType, { value: 'ITEM' })])
  );
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
  const entityIndex = getInventoryEntityIndex(world, holderID ?? 0, itemIndex);
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
  const { EntityType, OwnsInvID, IsRegistry, ItemIndex } = components;

  const toQuery: QueryFragment[] = [];
  if (options?.owner) toQuery.push(HasValue(OwnsInvID, { value: options.owner }));
  if (options?.itemIndex) toQuery.push(HasValue(ItemIndex, { value: options.itemIndex }));
  toQuery.push(HasValue(EntityType, { value: 'INVENTORY' }));
  if (options?.registry !== undefined) {
    // registry is put last because of potential size
    if (options?.registry) toQuery.push(Has(IsRegistry));
    else toQuery.push(Not(IsRegistry));
  }

  const raw = Array.from(runQuery(toQuery));
  return raw.map((index): Inventory => getInventory(world, components, index));
};
