import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  getComponentValue,
  runQuery,
} from '@latticexyz/recs';

import { NetworkLayer } from 'layers/network/types';
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
export const getMerchant = (network: NetworkLayer, entityIndex: EntityIndex): Merchant => {
  const {
    world,
    components: { IsListing, RoomIndex, NPCIndex, Name },
  } = network;

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

  let listings = listingResults.map((entityIndex) => getListing(network, entityIndex));
  merchant.listings = listings.sort((a, b) => a.buyPrice - b.buyPrice);

  return merchant;
};

// the Merchant Index here is actually an NPCIndex
export const getMerchantByIndex = (network: NetworkLayer, index: number) => {
  const {
    components: { IsNPC, NPCIndex },
  } = network;
  const entityIndex = Array.from(runQuery([Has(IsNPC), HasValue(NPCIndex, { value: index })]))[0];

  return getMerchant(network, entityIndex);
};

export const getAllMerchants = (network: NetworkLayer) => {
  const {
    components: { IsNPC },
  } = network;
  const entityIndices = Array.from(runQuery([Has(IsNPC)]));

  return entityIndices.map((entityIndex) => getMerchant(network, entityIndex));
};
