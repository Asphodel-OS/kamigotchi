import { EntityIndex, HasValue, runQuery } from '@mud-classic/recs';

import { Components } from 'network/components';

interface QueryOptions {
  npxIndex?: number;
}

export const query = (comps: Components, options?: QueryOptions) => {
  const { EntityType, NPCIndex } = comps;
  const query = [];
  if (options?.npxIndex) query.push(HasValue(NPCIndex, { value: options.npxIndex }));
  query.push(HasValue(EntityType, { value: 'LISTING' }));
  return Array.from(runQuery(query));
};

export const queryByNPC = (components: Components, npcIndex: number): EntityIndex[] => {
  return query(components, { npxIndex: npcIndex });
};
