import { World } from '@mud-classic/recs';

import { Components } from 'network/components';
import { NullNPC } from './constants';
import { query, queryByIndex } from './queries';
import { get } from './types';

export const getAll = (world: World, comps: Components) => {
  const entities = query(comps);
  return entities.map((entity) => get(world, comps, entity));
};

// the Merchant Index here is actually an NPCIndex
export const getByIndex = (world: World, comps: Components, index: number) => {
  const entity = queryByIndex(world, comps, index);
  if (!entity) return NullNPC;
  return get(world, comps, entity);
};
