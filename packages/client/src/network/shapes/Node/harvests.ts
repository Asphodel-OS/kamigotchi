import { EntityIndex, HasValue, World, runQuery } from '@mud-classic/recs';

import { Components } from 'network/components';

// query a Node entity for all active harvest entities attached to it
export const queryHarvests = (world: World, comps: Components, entity: EntityIndex) => {
  const { EntityType, SourceID, State } = comps;
  const id = world.entities[entity];

  // get list of active harvests on this node
  return Array.from(
    runQuery([
      HasValue(SourceID, { value: id }), // most constraining field first
      HasValue(State, { value: 'ACTIVE' }),
      HasValue(EntityType, { value: 'HARVEST' }),
    ])
  );
};
