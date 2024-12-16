import { EntityIndex, World } from '@mud-classic/recs';

import { Components } from 'network/';
import { getKillsForKiller, getKillsForVictim, KillLog } from '../Kill';

export interface Battles {
  kills: KillLog[];
  deaths: KillLog[];
}

// get all kill logs featuring a Kami (by its entityIndex)
export const getBattles = (
  world: World,
  components: Components,
  entityIndex: EntityIndex
): Battles => {
  return {
    kills: getKillsForKiller(world, components, entityIndex),
    deaths: getKillsForVictim(world, components, entityIndex),
  };
};
