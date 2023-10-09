import {
  EntityIndex,
  EntityID,
  Has,
  HasValue,
  getComponentValue,
  runQuery,
} from '@latticexyz/recs';

import { Layers } from 'src/types';
import { Listing, getListing } from './Listing';
import { numberToHex } from 'utils/hex';

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
  layers: Layers,
  entityIndex: EntityIndex,
): Merchant => {
  const {
    network: {
      world,
      components: {
        IsListing,
        Location,
        NPCIndex,
        Name,
      },
    },
  } = layers;

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

  let listings = listingResults.map((entityIndex) => getListing(layers, entityIndex));
  merchant.listings = listings.sort((a, b) => a.buyPrice - b.buyPrice);

  return merchant;
}

// the Merchant Index here is actually an NPCIndex
export const getMerchantByIndex = (layers: Layers, index: number) => {
  const { network: { components: { IsNPC, NPCIndex } } } = layers;
  const entityIndex = Array.from(
    runQuery([
      Has(IsNPC),
      HasValue(NPCIndex, { value: numberToHex(index) }),
    ])
  )[0];

  return getMerchant(layers, entityIndex);
}