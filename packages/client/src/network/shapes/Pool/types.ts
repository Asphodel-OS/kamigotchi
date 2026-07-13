import { EntityID, EntityIndex, getComponentValue, World } from 'engine/recs';

import { Components } from 'network/';
import { getItemByIndex, Item } from 'network/shapes/Item';
import { getEntityByHash } from '../utils';
import { getKeys, getValue } from '../utils/component';

// a constant-product (x*y=k) market between two fungible items.
// reserves are the pool entity's own inventory balances
export interface Pool {
  id: EntityID;
  entity: EntityIndex;
  itemA: Item; // canonical lo index
  itemB: Item; // canonical hi index
  reserveA: number;
  reserveB: number;
  feeBps: number;
  totalSupply: number;
  disabled: boolean;
}

// get a Pool from its EntityIndex
export const get = (world: World, comps: Components, entity: EntityIndex): Pool => {
  const id = world.entities[entity];
  const [indexA, indexB] = getKeys(comps, entity);

  return {
    id,
    entity,
    itemA: getItemByIndex(world, comps, indexA),
    itemB: getItemByIndex(world, comps, indexB),
    reserveA: getReserve(world, comps, id, indexA),
    reserveB: getReserve(world, comps, id, indexB),
    feeBps: getValue(comps, entity),
    totalSupply: getTotalSupply(world, comps, id),
    disabled: getComponentValue(comps.IsDisabled, entity)?.value ?? false,
  };
};

// a pool's reserve of an item is its own inventory balance
export const getReserve = (
  world: World,
  comps: Components,
  poolID: EntityID,
  itemIndex: number
): number => {
  const entity = genReserveEntity(world, poolID, itemIndex);
  return entity ? getValue(comps, entity) : 0;
};

export const getTotalSupply = (world: World, comps: Components, poolID: EntityID): number => {
  const entity = genSupplyEntity(world, poolID);
  return entity ? getValue(comps, entity) : 0;
};

// LP shares held by an account (or any holder) in a pool
export const getShares = (
  world: World,
  comps: Components,
  poolID: EntityID,
  holderID: EntityID
): number => {
  const entity = genShareEntity(world, poolID, holderID);
  return entity ? getValue(comps, entity) : 0;
};

/////////////////
// ENTITY HASHES (mirror LibPool/LibPoolRegistry genIDs)

export const genReserveEntity = (world: World, poolID: EntityID, itemIndex: number) => {
  return getEntityByHash(
    world,
    ['inventory.instance', poolID, itemIndex],
    ['string', 'uint256', 'uint32']
  );
};

export const genSupplyEntity = (world: World, poolID: EntityID) => {
  return getEntityByHash(world, ['amm.pool.supply', poolID], ['string', 'uint256']);
};

export const genShareEntity = (world: World, poolID: EntityID, holderID: EntityID) => {
  return getEntityByHash(
    world,
    ['amm.pool.share', poolID, holderID],
    ['string', 'uint256', 'uint256']
  );
};

export const genPoolEntity = (world: World, indexA: number, indexB: number) => {
  const [lo, hi] = indexA < indexB ? [indexA, indexB] : [indexB, indexA];
  return getEntityByHash(world, ['amm.pool', lo, hi], ['string', 'uint32', 'uint32']);
};
