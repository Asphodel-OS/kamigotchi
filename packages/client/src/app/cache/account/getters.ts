import { EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import {
  AccountStats,
  getAccountFriends,
  getAccountStats,
  queryAccountInventories,
  queryAccountKamis,
} from 'network/shapes/Account';
import { getInventory } from '../inventory';
import { getKami, KamiRefreshOptions } from '../kami';

// get all Friend objects for an Account entity
// TODO: run some caching on this
export const getFriends = (world: World, components: Components, entity: EntityIndex) => {
  return getAccountFriends(world, components, entity);
};

// get all Kami objects for an Account entity
export const getKamis = (
  world: World,
  components: Components,
  entity: EntityIndex,
  kamiOptions?: KamiRefreshOptions,
  debug?: boolean
) => {
  if (!entity) return [];
  const kamiEntities = queryAccountKamis(world, components, entity);
  return kamiEntities.map((kEntity) => getKami(world, components, kEntity, kamiOptions, debug));
};

// get all Inventory objects for an Account entity
export const getInventories = (world: World, components: Components, entity: EntityIndex) => {
  if (!entity) return [];
  const inventoryEntities = queryAccountInventories(world, components, entity);
  return inventoryEntities.map((invEntity) => getInventory(world, components, invEntity));
};

// get the Stats fields for an Account entity
export const getStats = (
  world: World,
  components: Components,
  entity: EntityIndex
): AccountStats => {
  if (!entity) return { coin: 0, kills: 0, vip: 0 };
  return getAccountStats(world, components, entity);
};
