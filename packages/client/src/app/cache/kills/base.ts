import { EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { getKill, KillLog } from 'network/shapes/Kill';

export const KillCache = new Map<EntityIndex, KillLog>();

export const get = (world: World, components: Components, entity: EntityIndex) => {
  if (!KillCache.has(entity)) process(world, components, entity);
  return KillCache.get(entity)!;
};

export const process = (world: World, components: Components, entity: EntityIndex) => {
  const kill = getKill(world, components, entity);
  KillCache.set(entity, kill);
};
