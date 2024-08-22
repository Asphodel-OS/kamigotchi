import { EntityID, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { query } from './queries';
import { Options, getKami } from './types';

// get all Kamis
export const getAll = (world: World, components: Components, options?: Options) => {
  return query(components, {}).map((index) => getKami(world, components, index, options));
};

// get a Kami by its index (token ID)
// TODO: handle failed queries with a default NullKami
export const getByIndex = (
  world: World,
  components: Components,
  index: number,
  options?: Options
) => {
  const results = query(components, { index: index });
  if (results.length == 0) return;

  const entity = results[0];
  return getKami(world, components, entity, options);
};

// gat all Kamis owned by an Account based on its ID
export const getByAccount = (
  world: World,
  components: Components,
  accountID: string,
  options?: Options
) => {
  const results = query(components, { account: accountID as EntityID });
  return results.map((index) => getKami(world, components, index, options));
};

// get all Kamis based on their state
export const getByState = (
  world: World,
  components: Components,
  state: string,
  options?: Options
) => {
  const results = query(components, { state });
  return results.map((index) => getKami(world, components, index, options));
};
