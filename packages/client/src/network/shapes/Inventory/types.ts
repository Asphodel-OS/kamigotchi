import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  World,
  getComponentValue,
  runQuery,
} from '@mud-classic/recs';

import { Components } from 'network/components';
import { Item, getItem } from '../Item';
import { NullItem } from '../Item/types';

export const NULL_INVENTORY: Inventory = {
  id: '0' as EntityID,
  entityIndex: 0 as EntityIndex,
  item: NullItem,
  balance: 0,
};

// standardized shape of a FE Inventory Entity
export interface Inventory {
  id: EntityID;
  entityIndex: EntityIndex;
  balance: number;
  item: Item;
}

// get an Inventory from its EntityIndex
export const getInventory = (
  world: World,
  components: Components,
  entityIndex: EntityIndex
): Inventory => {
  const { Value, IsRegistry, ItemIndex } = components;

  // retrieve item details based on the registry
  const itemIndex = getComponentValue(ItemIndex, entityIndex)?.value as number;
  const registryEntityIndex = Array.from(
    runQuery([Has(IsRegistry), HasValue(ItemIndex, { value: itemIndex })])
  )[0];

  const inventory = {
    id: world.entities[entityIndex],
    entityIndex: entityIndex,
    item: getItem(world, components, registryEntityIndex),
    balance: (getComponentValue(Value, entityIndex)?.value as number) * 1,
  };

  return inventory;
};
