import { World } from 'engine/recs';

import { Components } from 'network/';
import { query } from './queries';
import { genPoolEntity, get, Pool } from './types';

export const getAll = (world: World, comps: Components): Pool[] => {
  return query(comps).map((entity) => get(world, comps, entity));
};

// get a pool by its item pair (order-insensitive)
export const getByItems = (
  world: World,
  comps: Components,
  indexA: number,
  indexB: number
): Pool | undefined => {
  const entity = genPoolEntity(world, indexA, indexB);
  return entity ? get(world, comps, entity) : undefined;
};
