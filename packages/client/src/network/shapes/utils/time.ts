import { EntityIndex, getComponentValue } from '@mud-classic/recs';

import { Components } from 'network/';

// get the last action time of an entity
export const getLastTime = (components: Components, entity: EntityIndex): number => {
  const { LastTime } = components;
  return (getComponentValue(LastTime, entity)?.value ?? 0) as number;
};
