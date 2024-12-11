import { World } from '@mud-classic/recs';
import { Components } from 'network/';
import { queryRegistry } from './queries';
import { get, ScavBar } from './types';

export const getByFieldAndIndex = (
  world: World,
  components: Components,
  scavField: string,
  scavIndex: number
): ScavBar | undefined => {
  if (!scavIndex) return;
  const entity = queryRegistry(world, scavField, scavIndex);
  return entity ? get(world, components, entity, scavField, scavIndex) : undefined;
};
