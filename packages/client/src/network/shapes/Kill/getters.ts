import { EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { queryForKiller, queryForVictim } from './queries';
import { KillLog, get } from './types';

// get Kill Log objects for a Kami (by entity) where it performed a kill
export const getForKiller = (
  world: World,
  components: Components,
  entity: EntityIndex
): KillLog[] => {
  const results = queryForKiller(world, components, entity);
  return results.map((killEntity) => get(world, components, killEntity));
};

// get Kill Logs objects for a Kami (by entity) where it died
export const getForVictim = (
  world: World,
  components: Components,
  entity: EntityIndex
): KillLog[] => {
  const results = queryForVictim(world, components, entity);
  return results.map((killEntity) => get(world, components, killEntity));
};
