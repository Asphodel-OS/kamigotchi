import { EntityID, EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { getItemByIndex, Item } from 'network/shapes/Item';
import { Condition, getConditionsOfID } from '../Conditional';
import { getNPCByIndex, NPC } from '../Npc';
import { hashArgs } from '../utils';
import {
  getBalance,
  getCurrencyIndex,
  getItemIndex,
  getNPCIndex,
  getStartTime,
  getValue,
} from '../utils/component';
import { genBuyEntity, genSellEntity, getPricing, Pricing } from './pricing';

export interface Listing {
  id: EntityID;
  entity: EntityIndex;
  item: Item;
  payItem: Item;
  value: number; // target value of the listing
  balance: number; // tracking of net balances bought vs sold
  startTime: number;
  requirements: Condition[];
  buy?: Pricing;
  sell?: Pricing;
  npc?: NPC;
}

export interface ListingOptions {
  npc?: boolean;
}

// get an Listing from its EntityIndex
export const get = (
  world: World,
  comps: Components,
  entity: EntityIndex,
  options?: ListingOptions
): Listing => {
  const id = world.entities[entity];
  const itemIndex = getItemIndex(comps, entity);
  const currencyIndex = getCurrencyIndex(comps, entity);

  let listing: Listing = {
    id,
    entity,
    item: getItemByIndex(world, comps, itemIndex),
    payItem: getItemByIndex(world, comps, currencyIndex),
    value: getValue(comps, entity),
    balance: getBalance(comps, entity),
    startTime: getStartTime(comps, entity),
    requirements: getConditionsOfID(world, comps, genReqAnchor(id)),
  };

  // set pricing entities if they exist
  const buyEntity = genBuyEntity(world, id);
  const sellEntity = genSellEntity(world, id);
  if (buyEntity) listing.buy = getPricing(comps, buyEntity);
  if (sellEntity) listing.sell = getPricing(comps, sellEntity);

  // populate optional fields
  // TODO: make item and currency optional
  if (options?.npc) {
    const npcIndex = getNPCIndex(comps, entity);
    listing.npc = getNPCByIndex(world, comps, npcIndex);
  }
  return listing;
};

export const genReqAnchor = (id: EntityID): EntityID => {
  return hashArgs(['listing.requirement', id], ['string', 'uint256'], true);
};
