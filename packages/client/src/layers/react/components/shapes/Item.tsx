import {
  EntityIndex,
  EntityID,
  getComponentValue,
  getComponentValueStrict,
} from '@latticexyz/recs';

import { Layers } from 'src/types';
import { Stats, getStats } from './Stats';

// standardized shape of a FE Item Entity
export interface Item {
  id: EntityID;
  index: number;
  specialIndex: number;
  type: string;
  name: string;
  description: string;
  uri?: string;
  stats: Stats;
}

// get a Node from its EntityIndex
export const getItem = (
  layers: Layers,
  index: EntityIndex,
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
  if (getComponentValue(FoodIndex, index) !== undefined) {
    type = 'FOOD';
  } else if (getComponentValue(ReviveIndex, index) !== undefined) {
    type = 'REVIVE';
  }

  let Item: Item = {
    id: world.entities[index],
    type,
    index: getComponentValue(ItemIndex, index)?.value as number,
    specialIndex: getComponentValue(FoodIndex, index)?.value as number || getComponentValue(ReviveIndex, index)?.value as number,
    name: getComponentValue(Name, index)?.value as string,
    description: getComponentValue(Description, index)?.value as string,
    stats: getStats(layers, index),
  }

  return Item;
}