import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  World,
  getComponentValue,
  runQuery,
} from '@mud-classic/recs';

import { Components } from 'layers/network';
import { Item, getItem } from './Item';

// standardized shape of a FE Listing Entity
export interface Listing {
  id: EntityID;
  entityIndex: EntityIndex;
  buyPrice: number;
  item: Item;
}

// get an Listing from its EntityIndex
export const getListing = (world: World, components: Components, index: EntityIndex): Listing => {
  const { IsRegistry, ItemIndex, PriceBuy } = components;

  // retrieve item details based on the registry
  const itemIndex = getComponentValue(ItemIndex, index)?.value as number;
  const registryEntityIndex = Array.from(
    runQuery([Has(IsRegistry), HasValue(ItemIndex, { value: itemIndex })])
  )[0];
  const item = getItem(world, components, registryEntityIndex);

  let listing: Listing = {
    id: world.entities[index],
    entityIndex: index,
    buyPrice: (getComponentValue(PriceBuy, index)?.value as number) * 1,
    item: item,
  };

  return listing;
};
