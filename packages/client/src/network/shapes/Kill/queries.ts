import { EntityIndex, Has, HasValue, runQuery, World } from '@mud-classic/recs';

import { Components } from 'network/';

// query KillLog entities by a killer Kami entity
export const queryForKiller = (
  world: World,
  components: Components,
  entity: EntityIndex
): EntityIndex[] => {
  const { IsKill, SourceID } = components;
  const id = world.entities[entity];
  return Array.from(runQuery([HasValue(SourceID, { value: id }), Has(IsKill)]));
};

// query KillLog entities by a victim Kami entity
export const queryForVictim = (
  world: World,
  components: Components,
  entity: EntityIndex
): EntityIndex[] => {
  const { IsKill, TargetID } = components;
  const id = world.entities[entity];
  return Array.from(runQuery([HasValue(TargetID, { value: id }), Has(IsKill)]));
};
