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
import { Listing, getListing } from './Listing';

// standardized shape of a FE Merchant Entity
export interface Merchant {
  id: EntityID;
  index: number;
  entityIndex: EntityIndex;
  name: string;
  roomIndex: number;
  listings: Listing[];
}

// get an Merchant from its EntityIndex
export const getMerchant = (
  world: World,
  components: Components,
  entityIndex: EntityIndex
): Merchant => {
  const { IsListing, RoomIndex, NPCIndex, Name } = components;

  let merchant: Merchant = {
    id: world.entities[entityIndex],
    index: getComponentValue(NPCIndex, entityIndex)?.value as number,
    entityIndex,
    name: getComponentValue(Name, entityIndex)?.value as string,
    roomIndex: getComponentValue(RoomIndex, entityIndex)?.value as number,
    listings: [],
  };

  // retrieve item details based on the registry
  const listingResults = Array.from(
    runQuery([Has(IsListing), HasValue(NPCIndex, { value: merchant.index })])
  );

  let listings = listingResults.map((entityIndex) => getListing(world, components, entityIndex));
  merchant.listings = listings.sort((a, b) => a.buyPrice - b.buyPrice);

  return merchant;
};

// the Merchant Index here is actually an NPCIndex
export const getMerchantByIndex = (world: World, components: Components, index: number) => {
  const { IsNPC, NPCIndex } = components;
  const entityIndex = Array.from(runQuery([Has(IsNPC), HasValue(NPCIndex, { value: index })]))[0];
  return getMerchant(world, components, entityIndex);
};

export const getAllMerchants = (world: World, components: Components) => {
  const { IsNPC } = components;
  const entityIndices = Array.from(runQuery([Has(IsNPC)]));
  return entityIndices.map((entityIndex) => getMerchant(world, components, entityIndex));
};
