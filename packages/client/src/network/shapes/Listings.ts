import {
  EntityID,
  EntityIndex,
  Has,
  HasValue,
  World,
  getComponentValue,
  runQuery,
} from '@mud-classic/recs';

import { utils } from 'ethers';
import { Components } from 'network/';
import { Item, getItem } from 'network/shapes/Item';
import { Account } from './Account';
import { passesConditions, queryConditionsOfID } from './Conditional';

export const getNPCListingsFiltered = (
  world: World,
  components: Components,
  npcIndex: number,
  account: Account
): Listing[] => {
  const allListings = queryNPCListingEntities(components, npcIndex);

  const filtered = allListings.filter((entityIndex) => {
    const reqs = queryConditionsOfID(world, components, getReqPtrID(world.entities[entityIndex]));
    return passesConditions(world, components, reqs, account);
  });

  return sortListings(filtered.map((entityIndex) => getListing(world, components, entityIndex)));
};

/////////////////
// SHAPES

// standardized shape of a FE Listing Entity
export interface Listing {
  id: EntityID;
  entityIndex: EntityIndex;
  buyPrice: number;
  item: Item;
  NPCIndex: number;
}

// get an Listing from its EntityIndex
export const getListing = (world: World, components: Components, index: EntityIndex): Listing => {
  const { IsRegistry, ItemIndex, NPCIndex, Value } = components;

  // retrieve item details based on the registry
  const itemIndex = getComponentValue(ItemIndex, index)?.value as number;
  const registryEntityIndex = Array.from(
    runQuery([Has(IsRegistry), HasValue(ItemIndex, { value: itemIndex })])
  )[0];
  const item = getItem(world, components, registryEntityIndex);

  const id = world.entities[index];
  let listing: Listing = {
    id: id,
    entityIndex: index,
    buyPrice: getBuyPrice(world, components, id),
    item: item,
    NPCIndex: (getComponentValue(NPCIndex, index)?.value as number) * 1,
  };

  return listing;
};

const getBuyPrice = (world: World, components: Components, listingID: EntityID): number => {
  const { Value } = components;

  const entityIndex = getBuyPtrEntity(world, listingID);
  if (!entityIndex) return 0;

  return (getComponentValue(Value, entityIndex)?.value as number) * 1;
};

/////////////////
// QUERIES

export const queryNPCListingEntities = (
  components: Components,
  npcIndex: number
): EntityIndex[] => {
  const { NPCIndex, IsListing } = components;
  return Array.from(runQuery([Has(IsListing), HasValue(NPCIndex, { value: npcIndex })]));
};

/////////////////
// UTILS

// sorts listing by type of effect, then by price
// NOTE(jb): lol
export const sortListings = (listings: Listing[]): Listing[] => {
  return listings.sort((a, b) => {
    const aStats = a.item.stats;
    const bStats = b.item.stats;
    if (!aStats) return 1;
    if (!bStats) return -1;

    if (aStats.health.sync > 0 && bStats.health.sync === 0) return -1;
    else if (aStats.health.sync === 0 && bStats.health.sync > 0) return 1;

    const healthDiff = aStats.health.sync - bStats.health.sync;
    const staminaDiff = aStats.stamina.sync - bStats.stamina.sync;
    return healthDiff + staminaDiff;
  });
};

const IDStore = new Map<string, string>();

const getReqPtrID = (regID: EntityID): EntityID => {
  let id = '';
  const key = 'listing.requirement' + regID;
  if (IDStore.has(key)) id = IDStore.get(key)!;
  else {
    id = utils.solidityKeccak256(['string', 'uint256'], ['listing.requirement', regID]);
    IDStore.set(key, id);
  }
  return id as EntityID; // ignore leading 0 pruning; for direct SC querying
};

const getBuyPtrEntity = (world: World, regID: EntityID): EntityIndex | undefined => {
  let id = '';
  const key = 'listing.buy' + regID;
  if (IDStore.has(key)) id = IDStore.get(key)!;
  else {
    id = utils.solidityKeccak256(['string', 'uint256'], ['listing.buy', regID]);
    IDStore.set(key, id);
  }
  return world.entityToIndex.get(id as EntityID);
};
