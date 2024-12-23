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
import { Account } from './Account';
import { getConditionsOfID, passesConditions } from './Conditional';
import { getEntityByHash, hashArgs } from './utils';

export const getNPCListingsFiltered = (
  world: World,
  components: Components,
  npcIndex: number,
  account: Account
): Listing[] => {
  const allListings = queryNPCListingEntities(components, npcIndex);

  const filtered = allListings.filter((entity) => {
    const reqs = getConditionsOfID(world, components, getReqPtrID(world.entities[entity]));
    return passesConditions(world, components, reqs, account);
  });

  return sortListings(filtered.map((entity) => getListing(world, components, entity)));
};

/////////////////
// SHAPES

// standardized shape of a FE Listing Entity
export interface Listing {
  id: EntityID;
  entity: EntityIndex;
  buyPrice: number;
  item: Item;
  NPCIndex: number;
}

// get an Listing from its EntityIndex
export const getListing = (world: World, components: Components, index: EntityIndex): Listing => {
  const { IsRegistry, ItemIndex, NPCIndex } = components;

  // retrieve item details based on the registry
  const itemIndex = getComponentValue(ItemIndex, index)?.value as number;
  const registryEntityIndex = Array.from(
    runQuery([Has(IsRegistry), HasValue(ItemIndex, { value: itemIndex })])
  )[0];
  const item = getItem(world, components, registryEntityIndex);

  const id = world.entities[index];
  let listing: Listing = {
    id: id,
    entity: index,
    buyPrice: getBuyPrice(world, components, id),
    item: item,
    NPCIndex: (getComponentValue(NPCIndex, index)?.value as number) * 1,
  };

  return listing;
};

const getBuyPrice = (world: World, components: Components, listingID: EntityID): number => {
  const { Value } = components;

  const entity = getBuyPtrEntity(world, listingID);
  if (!entity) return 0;

  return (getComponentValue(Value, entity)?.value as number) * 1;
};

/////////////////
// QUERIES

export const queryNPCListingEntities = (
  components: Components,
  npcIndex: number
): EntityIndex[] => {
  const { NPCIndex, EntityType } = components;
  return Array.from(
    runQuery([HasValue(NPCIndex, { value: npcIndex }), HasValue(EntityType, { value: 'LISTING' })])
  );
};

/////////////////
// UTILS

// sorts listing by item index
export const sortListings = (listings: Listing[]): Listing[] => {
  return listings.sort((a, b) => a.item.index - b.item.index);
};

//////////////////
// IDs

const getReqPtrID = (regID: EntityID): EntityID => {
  return hashArgs(['listing.requirement', regID], ['string', 'uint256'], true);
};

const getBuyPtrEntity = (world: World, regID: EntityID): EntityIndex | undefined => {
  return getEntityByHash(world, ['listing.buy', regID], ['string', 'uint256']);
};
