import { EntityIndex, getComponentValue } from '@mud-classic/recs';

import { Components } from 'network/';

export interface Times {
  cooldown: number;
  last: number;
  start: number;
}

// populate the time-tracking fields of a kami
export const getTimes = (components: Components, entity: EntityIndex): Times => {
  const { LastActionTime, LastTime, StartTime } = components;

  return {
    cooldown: (getComponentValue(LastActionTime, entity)?.value as number) * 1,
    last: (getComponentValue(LastTime, entity)?.value as number) * 1,
    start: (getComponentValue(StartTime, entity)?.value as number) * 1,
  };
};
