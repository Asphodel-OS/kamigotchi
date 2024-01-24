import {
  EntityIndex,
  EntityID,
  Has,
  HasValue,
  getComponentValue,
  runQuery,
} from '@latticexyz/recs';

import { Listing, getListing } from './Listing';
import { numberToHex } from 'utils/hex';
import { NetworkLayer } from 'layers/network/types';


// standardized shape of a FE Merchant Entity
export interface Merchant {
  id: EntityID;
  index: number;
  entityIndex: EntityIndex;
  name: string;
  location: number;
  listings: Listing[];
}

// get an Merchant from its EntityIndex
export const getMerchant = (
  network: NetworkLayer,
  entityIndex: EntityIndex,
): Merchant => {
  const {
    world,
    components: {
      IsListing,
      Location,
      NPCIndex,
      Name,
    },
  } = network;

  let merchant: Merchant = {
    id: world.entities[entityIndex],
    index: getComponentValue(NPCIndex, entityIndex)?.value as number,
    entityIndex,
    name: getComponentValue(Name, entityIndex)?.value as string,
    location: getComponentValue(Location, entityIndex)?.value as number,
    listings: [],
  }

  // retrieve item details based on the registry
  const listingResults = Array.from(
    runQuery([
      Has(IsListing),
      HasValue(NPCIndex, { value: merchant.index }),
    ])
  );

  let listings = listingResults.map((entityIndex) => getListing(network, entityIndex));
  merchant.listings = listings.sort((a, b) => a.buyPrice - b.buyPrice);

  return merchant;
}

// the Merchant Index here is actually an NPCIndex
export const getMerchantByIndex = (network: NetworkLayer, index: number) => {
  const { components: { IsNPC, NPCIndex } } = network;
  const entityIndex = Array.from(
    runQuery([
      Has(IsNPC),
      HasValue(NPCIndex, { value: numberToHex(index) }),
    ])
  )[0];

  return getMerchant(network, entityIndex);
}