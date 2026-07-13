import { EntityIndex, HasValue, runQuery } from 'engine/recs';

import { Components } from 'network/components';

// get all Pool entities
export const query = (comps: Components): EntityIndex[] => {
  const { EntityType } = comps;
  return Array.from(runQuery([HasValue(EntityType, { value: 'POOL' })]));
};
