import { World } from '@mud-classic/recs';

import { Components } from 'network/components';
import { NullNPC } from './constants';
import { query, queryByIndex } from './queries';
import { get, Options } from './types';

export const getAll = (world: World, comps: Components, options?: Options) => {
  const entities = query(comps);
  return entities.map((entity) => get(world, comps, entity, options));
};

// the Merchant Index here is actually an NPCIndex
export const getByIndex = (world: World, comps: Components, index: number, options?: Options) => {
  const entity = queryByIndex(world, comps, index);
  if (!entity) return NullNPC;
  return get(world, comps, entity, options);
};
