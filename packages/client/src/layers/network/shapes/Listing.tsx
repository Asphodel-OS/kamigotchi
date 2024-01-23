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

// standardized shape of a FE Listing Entity
export interface Listing {
  id: EntityID;
  entityIndex: EntityIndex;
  buyPrice: number;
  item: Item;
}

// get an Listing from its EntityIndex
export const getListing = (
  layers: Layers,
  index: EntityIndex,
): Listing => {
  const {
    network: {
      world,
      components: {
        IsRegistry,
        ItemIndex,
        PriceBuy,
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

  let listing: Listing = {
    id: world.entities[index],
    entityIndex: index,
    buyPrice: getComponentValue(PriceBuy, index)?.value as number * 1,
    item: item,
  }

  return listing;
}
