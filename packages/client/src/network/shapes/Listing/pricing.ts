import { EntityID, EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/components';
import { getEntityByHash } from '../utils';
import { getScale, getType } from '../utils/component';

type PriceType = 'FIXED' | 'SCALED';

export interface Pricing {
  type: PriceType;
  scale: number;
}

export const getPricing = (comps: Components, entity: EntityIndex): Pricing => {
  return {
    type: getType(comps, entity) as PriceType,
    scale: getScale(comps, entity),
  };
};

export const genBuyEntity = (world: World, listingID: EntityID) => {
  return getEntityByHash(world, ['listing.buy', listingID], ['string', 'uint256']);
};

export const genSellEntity = (world: World, listingID: EntityID) => {
  return getEntityByHash(world, ['listing.sell', listingID], ['string', 'uint256']);
};
