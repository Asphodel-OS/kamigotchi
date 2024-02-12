import {
  EntityIndex,
  EntityID,
  Has,
  HasValue,
  getComponentValue,
  runQuery,
} from '@latticexyz/recs';

import { Item, getItem } from './Item';
import { NetworkLayer } from 'layers/network/types';

// standardized shape of a FE Listing Entity
export interface Listing {
  id: EntityID;
  entityIndex: EntityIndex;
  buyPrice: number;
  item: Item;
}

// get an Listing from its EntityIndex
export const getListing = (
  network: NetworkLayer,
  index: EntityIndex
): Listing => {
  const {
    world,
    components: { IsRegistry, ItemIndex, PriceBuy },
  } = network;

  // retrieve item details based on the registry
  const itemIndex = getComponentValue(ItemIndex, index)?.value as number;
  const registryEntityIndex = Array.from(
    runQuery([Has(IsRegistry), HasValue(ItemIndex, { value: itemIndex })])
  )[0];
  const item = getItem(network, registryEntityIndex);

  let listing: Listing = {
    id: world.entities[index],
    entityIndex: index,
    buyPrice: (getComponentValue(PriceBuy, index)?.value as number) * 1,
    item: item,
  };

  return listing;
};
