import { World } from 'engine/recs';
import { Components } from 'network/';
import { queryRegistry } from './queries';
import { get, ScavBar } from './types';

// get a scavenge entity by its type and index
export const getByFieldAndIndex = (
  world: World,
  comps: Components,
  type: string,
  index: number
): ScavBar | undefined => {
  if (!index) return;
  const entity = queryRegistry(world, type, index);
  return entity ? get(world, comps, entity, type, index) : undefined;
};
