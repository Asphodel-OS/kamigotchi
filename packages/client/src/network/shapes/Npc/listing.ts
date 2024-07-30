import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  World,
  getComponentValue,
  runQuery,
} from '@mud-classic/recs';

import { Components } from 'network/';
import { Item, getItem } from 'network/shapes/Item';

// standardized shape of a FE Listing Entity
export interface Listing {
  id: EntityID;
  entityIndex: EntityIndex;
  buyPrice: number;
  item: Item;
  NPCIndex: number;
}

// get an Listing from its EntityIndex
export const getListing = (world: World, components: Components, index: EntityIndex): Listing => {
  const { IsRegistry, ItemIndex, NPCIndex, PriceBuy } = components;

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
    NPCIndex: (getComponentValue(NPCIndex, index)?.value as number) * 1,
  };

  return listing;
};

// sorts listing by type of effect, then by price
// NOTE(jb): lol
export const sortListings = (listings: Listing[]): Listing[] => {
  return listings.sort((a, b) => {
    const aStats = a.item.stats;
    const bStats = b.item.stats;
    if (!aStats) return 1;
    if (!bStats) return -1;

    if (aStats.health.sync > 0 && bStats.health.sync === 0) return -1;
    else if (aStats.health.sync === 0 && bStats.health.sync > 0) return 1;

    const healthDiff = aStats.health.sync - bStats.health.sync;
    const staminaDiff = aStats.stamina.sync - bStats.stamina.sync;
    return healthDiff + staminaDiff;
  });
};
