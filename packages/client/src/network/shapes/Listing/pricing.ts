import { EntityID, EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/components';
import { getEntityByHash } from '../utils';
import { getDecay, getPeriod, getRate, getScale, getType } from '../utils/component';

type PriceType = 'FIXED' | 'GDA' | 'SCALED';

export interface Pricing {
  type: PriceType;
  period?: number;
  decay?: number;
  rate?: number;
  scale?: number;
}

export const getPricing = (world: World, comps: Components, entity: EntityIndex): Pricing => {
  const pricing: Pricing = {
    type: getType(comps, entity) as PriceType,
  };
  if (pricing.type === 'SCALED') {
    pricing.scale = getScale(comps, entity, 9);
  } else if (pricing.type === 'GDA') {
    pricing.period = getPeriod(comps, entity);
    pricing.decay = getDecay(comps, entity, 6);
    pricing.rate = getRate(comps, entity);
  }

  return pricing;
};

export const genBuyEntity = (world: World, listingID: EntityID) => {
  return getEntityByHash(world, ['listing.buy', listingID], ['string', 'uint256']);
};

export const genSellEntity = (world: World, listingID: EntityID) => {
  return getEntityByHash(world, ['listing.sell', listingID], ['string', 'uint256']);
};
