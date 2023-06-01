import {
  EntityIndex,
  EntityID,
  Has,
  HasValue,
  getComponentValue,
  runQuery,
} from '@latticexyz/recs';

import { Layers } from 'src/types';
import { Item, getItem } from './Item';

// standardized shape of a FE Inventory Entity
export interface Inventory {
  id: EntityID;
  entityIndex: EntityIndex;
  balance: number;
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

  // atm this only supports the shape of fungible items
  // in the case of non-fungible items, we'll need to update this to 
  // copy stats from the actual inventory entity, rather than the registry
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
    balance: getComponentValue(Balance, index)?.value as number,
    item: item,
  }

  return inventory;
}