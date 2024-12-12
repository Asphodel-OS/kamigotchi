import { EntityID, EntityIndex, getComponentValue, World } from '@mud-classic/recs';
import { formatEntityID } from 'engine/utils';
import { Components } from 'network/comps';
import { getHarvest } from 'network/shapes/Harvest';
import { BaseAccount, getBaseAccount, NullAccount } from '../Account';
import { NullKami } from './constants';
import { queryHarvest } from './harvest';
import { query, queryByIndex } from './queries';
import { getKami, Options } from './types';

/*
 * TODO: clean up this file, it's a tad disgusting
 */

// get all Kamis
export const getAll = (world: World, comps: Components, options?: Options) => {
  return query(comps, {}).map((index) => getKami(world, comps, index, options));
};

// get a Kami by its index (token ID)
// TODO: handle failed queries with a default NullKami
export const getByIndex = (world: World, comps: Components, index: number, options?: Options) => {
  const results = query(comps, { index: index });
  if (results.length == 0) return NullKami;
  const entity = results[0];
  return getKami(world, comps, entity, options);
};

// gat all Kamis owned by an Account based on its ID
export const getByAccount = (
  world: World,
  comps: Components,
  accountID: string,
  options?: Options
) => {
  const results = query(comps, { account: accountID as EntityID });
  return results.map((index) => getKami(world, comps, index, options));
};

export const getByName = (world: World, comps: Components, name: string) => {
  const results = query(comps, { name });
  return results.map((index) => getKami(world, comps, index));
};

// get all Kamis based on their state
export const getByState = (world: World, comps: Components, state: string, options?: Options) => {
  const results = query(comps, { state });
  return results.map((index) => getKami(world, comps, index, options));
};

////////////////
// OTHER GETTERS

// get the BaseAccount entity that owns a Kami, queried by kami index
export const getAccount = (world: World, comps: Components, index: number): BaseAccount => {
  const { OwnsKamiID } = comps;

  const kamiEntity = queryByIndex(world, comps, index);
  if (!kamiEntity) return NullAccount;

  const rawAccID = getComponentValue(OwnsKamiID, kamiEntity)?.value ?? '';
  if (!rawAccID) return NullAccount;

  const accID = formatEntityID(rawAccID);
  const accEntity = world.entityToIndex.get(accID);
  if (!accEntity) return NullAccount;

  return getBaseAccount(world, comps, accEntity);
};

// get Kami harvesting location
export const getLocation = (world: World, comps: Components, entity: EntityIndex) => {
  const harvestEntity = queryHarvest(world, entity);
  if (harvestEntity) {
    const harvestInfo = getHarvest(world, comps, harvestEntity, { node: true });
    return harvestInfo.state === 'ACTIVE' ? harvestInfo.node?.index : undefined;
  }
};
