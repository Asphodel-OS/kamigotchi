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
  index: EntityIndex,
): Merchant => {
  const {
    network: {
      world,
      components: {
        IsListing,
        Location,
        MerchantIndex,
        Name,
      },
    },
  } = layers;

  const merchantIndex = getComponentValue(MerchantIndex, index)?.value as number;

  let merchant: Merchant = {
    id: world.entities[index],
    index: merchantIndex,
    entityIndex: index,
    name: getComponentValue(Name, index)?.value as string,
    location: getComponentValue(Location, index)?.value as number,
    listings: [],
  }

  // retrieve item details based on the registry
  const listingResults = Array.from(
    runQuery([
      Has(IsListing),
      HasValue(MerchantIndex, { value: merchant.index }),
    ])
  );

  let listings = listingResults.map((index) => getListing(layers, index));
  merchant.listings = listings.sort((a, b) => a.buyPrice - b.buyPrice);

  return merchant;
}