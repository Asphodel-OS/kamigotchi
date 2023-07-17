import {
  EntityIndex,
  EntityID,
  getComponentValue,
} from '@latticexyz/recs';

import { Layers } from 'src/types';
import { Stats, getStats } from './Stats';

// The standard shape of a FE Item Entity
export interface Item {
  id: EntityID;
  entityIndex: EntityIndex;
  index: number;
  familyIndex: number;
  isFungible: boolean;
  type: string;
  name: string;
  description: string;
  uri?: string;
  stats: Stats;
}


/** 
 * Dedicated item entities technically do not exist on the SC side, outside of
 * registry shapes. Instead they exist as instances of Inventory Listings or
 * Equipment. SC-side items also have inconsistent form. Namely, Fungible items
 * reference their stats from the registry of the linked index, while
 * non-fungible items hold their stats directly on the entity itself.
 * 
 * Consequently, we must interpret these shapes based on context. This function
 * strictly retrieves registry-populated items and relies on higher layers to
 * repopulate the correct stats (for non-fungible items).
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
        Name,
      },
    },
  } = layers;

  // determine the type of the item based on the presence of indices
  let type = '';
  let isFungible = true;
  let familyIndex = 0;
  if (getComponentValue(FoodIndex, index) !== undefined) {
    type = 'FOOD';
    familyIndex = getComponentValue(FoodIndex, index)?.value as number;
  } else if (getComponentValue(ReviveIndex, index) !== undefined) {
    type = 'REVIVE';
    familyIndex = getComponentValue(ReviveIndex, index)?.value as number;
  }

  let Item: Item = {
    id: world.entities[index],
    entityIndex: index,
    index: getComponentValue(ItemIndex, index)?.value as number * 1,
    familyIndex: familyIndex * 1,
    type,
    isFungible,
    name: getComponentValue(Name, index)?.value as string,
    description: getComponentValue(Description, index)?.value as string,
    stats: getStats(layers, index),
  }

  return Item;
}