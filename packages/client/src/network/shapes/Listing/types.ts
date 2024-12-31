import { EntityID, EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { Item, getItemByIndex } from 'network/shapes/Item';
import { Condition, getConditionsOfID } from '../Conditional';
import { getEntityByHash, hashArgs } from '../utils';
import { getItemIndex, getValue } from '../utils/component';

export interface Listing {
  id: EntityID;
  entity: EntityIndex;
  item: Item;
  buyPrice: number;
  requirements: Condition[];
}

// get an Listing from its EntityIndex
export const get = (world: World, comps: Components, entity: EntityIndex): Listing => {
  const id = world.entities[entity];
  const itemIndex = getItemIndex(comps, entity);

  let listing: Listing = {
    id,
    entity,
    item: getItemByIndex(world, comps, itemIndex),
    buyPrice: getBuyPrice(world, comps, id),
    requirements: getConditionsOfID(world, comps, genReqAnchor(id)),
  };

  return listing;
};

const getBuyPrice = (world: World, comps: Components, id: EntityID): number => {
  const entity = getEntityByHash(world, ['listing.buy', id], ['string', 'uint256']);
  if (!entity) return 0;
  return getValue(comps, entity);
};

export const genReqAnchor = (id: EntityID): EntityID => {
  return hashArgs(['listing.requirement', id], ['string', 'uint256'], true);
};
