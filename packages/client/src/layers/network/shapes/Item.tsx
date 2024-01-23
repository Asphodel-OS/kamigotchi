import {
  EntityIndex,
  EntityID,
  Has,
  HasValue,
  getComponentValue,
  hasComponent,
  runQuery,
} from '@latticexyz/recs';

import { Stats, getStats } from './Stats';
import { baseURI } from "src/constants/media";
import { NetworkLayer } from 'layers/network/types';
import { numberToHex } from 'utils/hex';


// The standard shape of a FE Item Entity
export interface Item {
  id: EntityID;
  entityIndex: EntityIndex;
  index: number;
  isFungible: boolean;
  type: string;
  image: {
    default: string;
    x4: string;
  }
  name: string;
  description: string;
  familyIndex?: number;
  stats?: Stats;
}

/** 
 * Gets info about an item from an SC item registry
 * Supplements additional data for FE consumption if available
 */
export const getItem = (
  network: NetworkLayer,
  index: EntityIndex, // entity index of the registry instance
): Item => {
  const {
    world,
    components: {
      Description,
      FoodIndex,
      ReviveIndex,
      ItemIndex,
      IsConsumable,
      IsLootbox,
      MediaURI,
      Name,
      IsFungible,
    },
  } = network;

  let Item: Item = {
    id: world.entities[index],
    entityIndex: index,
    index: getComponentValue(ItemIndex, index)?.value as number * 1,
    isFungible: hasComponent(IsFungible, index),
    type: '',
    name: getComponentValue(Name, index)?.value as string ?? 'Unknown Item',
    image: {
      default: `${baseURI}${getComponentValue(MediaURI, index)?.value as string}`,
      x4: `${baseURI}${(getComponentValue(MediaURI, index)?.value as string).slice(0, -4)}_x4.png`,
    },
    description: getComponentValue(Description, index)?.value as string,
    stats: getStats(network, index),
  }

  // determine the type of the item based on the presence of indices
  if (getComponentValue(FoodIndex, index) !== undefined) {
    Item.type = 'FOOD';
    Item.familyIndex = getComponentValue(FoodIndex, index)?.value as number * 1;
  } else if (getComponentValue(ReviveIndex, index) !== undefined) {
    Item.type = 'REVIVE';
    Item.familyIndex = getComponentValue(ReviveIndex, index)?.value as number * 1;
  } else if (hasComponent(IsLootbox, index)) {
    Item.type = 'LOOTBOX';
  } else if (hasComponent(IsConsumable, index)) {
    Item.type = 'CONSUMABLE';
  }

  return Item;
}

export const getItemByIndex = (
  network: NetworkLayer,
  index: number, // item index of the registry instance
): Item => {
  const { components: { IsRegistry, ItemIndex } } = network;

  const entityIndices = Array.from(
    runQuery([
      Has(IsRegistry),
      HasValue(ItemIndex, { value: numberToHex(index) })
    ])
  );
  return getItem(network, entityIndices[0]);
}


// Query for a Food Registry entry by its FoodIndex
export const queryFoodRegistry = (network: NetworkLayer, index: number): EntityIndex => {
  const { components: { FoodIndex, IsRegistry } } = network;

  const entityIndices = Array.from(
    runQuery([
      Has(IsRegistry),
      HasValue(FoodIndex, { value: index })
    ])
  );
  return entityIndices[0];
}

// Query for a Revive Registry entry by its ReviveIndex
export const queryReviveRegistry = (network: NetworkLayer, index: number): EntityIndex => {
  const { components: { ReviveIndex, IsRegistry } } = network;

  const entityIndices = Array.from(
    runQuery([
      Has(IsRegistry),
      HasValue(ReviveIndex, { value: index })
    ])
  );
  return entityIndices[0];
}
