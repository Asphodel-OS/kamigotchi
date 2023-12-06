import {
  EntityIndex,
  EntityID,
  Has,
  HasValue,
  getComponentValue,
  hasComponent,
  runQuery,
} from '@latticexyz/recs';

import { Layers } from 'src/types';
import { Stats, getStats } from './Stats';
import { numberToHex } from 'utils/hex';

import { baseURI } from "src/constants/media";

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
  layers: Layers,
  index: EntityIndex, // entity index of the registry instance
): Item => {
  const {
    network: {
      world,
      components: {
        Description,
        FoodIndex,
        ReviveIndex,
        ItemIndex,
        IsLootbox,
        IsMiscItem,
        MediaURI,
        Name,
        IsFungible,
      },
    },
  } = layers;

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
    stats: getStats(layers, index),
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
  } else if (hasComponent(IsMiscItem, index)) {
    Item.type = 'MISC';
  }

  return Item;
}

export const getItemByIndex = (
  layers: Layers,
  index: number, // item index of the registry instance
): Item => {
  const {
    network: {
      components: {
        IsRegistry,
        ItemIndex,
      },
    },
  } = layers;

  const entityIndices = Array.from(
    runQuery([
      Has(IsRegistry),
      HasValue(ItemIndex, { value: numberToHex(index) })
    ])
  );
  return getItem(layers, entityIndices[0]);
}


// Query for a Food Registry entry by its FoodIndex
export const queryFoodRegistry = (layers: Layers, index: number): EntityIndex => {
  const {
    network: {
      components: { FoodIndex, IsRegistry },
    },
  } = layers;

  const entityIndices = Array.from(
    runQuery([
      Has(IsRegistry),
      HasValue(FoodIndex, { value: index })
    ])
  );
  return entityIndices[0];
}

// Query for a Revive Registry entry by its ReviveIndex
export const queryReviveRegistry = (layers: Layers, index: number): EntityIndex => {
  const {
    network: {
      components: { ReviveIndex, IsRegistry },
    },
  } = layers;

  const entityIndices = Array.from(
    runQuery([
      Has(IsRegistry),
      HasValue(ReviveIndex, { value: index })
    ])
  );
  return entityIndices[0];
}
