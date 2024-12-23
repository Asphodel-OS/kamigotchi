import { EntityID, EntityIndex, World } from '@mud-classic/recs';
import { Components } from 'network/comps';
import { getHarvest } from 'network/shapes/Harvest';
import { NullKami } from './constants';
import { queryHarvest } from './harvest';
import { query } from './queries';
import { get, Options } from './types';

/*
 * TODO: clean up this file, it's a tad disgusting
 */

// get all Kamis
export const getAll = (world: World, comps: Components, options?: Options) => {
  return query(comps, {}).map((index) => get(world, comps, index, options));
};

// get a Kami by its index (token ID)
// TODO: handle failed queries with a default NullKami
export const getByIndex = (world: World, comps: Components, index: number, options?: Options) => {
  const results = query(comps, { index: index });
  if (results.length == 0) return NullKami;
  const entity = results[0];
  return get(world, comps, entity, options);
};

// gat all Kamis owned by an Account based on its ID
export const getByAccount = (
  world: World,
  comps: Components,
  accountID: string,
  options?: Options
) => {
  const results = query(comps, { account: accountID as EntityID });
  return results.map((index) => get(world, comps, index, options));
};

export const getByName = (world: World, comps: Components, name: string, options?: Options) => {
  const results = query(comps, { name });
  return results.map((index) => get(world, comps, index, options));
};

// get all Kamis based on their state
export const getByState = (world: World, comps: Components, state: string, options?: Options) => {
  const results = query(comps, { state });
  return results.map((index) => get(world, comps, index, options));
};

////////////////
// OTHER GETTERS

// get Kami harvesting location
// TODO: move this to cache/kami/functions or somewhere similar
export const getLocation = (world: World, comps: Components, entity: EntityIndex) => {
  const harvestEntity = queryHarvest(world, entity);
  if (harvestEntity) {
    const harvestInfo = getHarvest(world, comps, harvestEntity, { node: true });
    return harvestInfo.state === 'ACTIVE' ? harvestInfo.node?.index : undefined;
  }
};
