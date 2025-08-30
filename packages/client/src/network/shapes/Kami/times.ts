import { EntityIndex } from '@mud-classic/recs';

import { Components } from 'network/';
import { getLastTime, getNextTime, getStartTime } from '../utils/component';

export interface Times {
  cooldown: number;
  last: number;
  start: number;
}

// populate the time-tracking fields of a kami
export const getTimes = (comps: Components, entity: EntityIndex): Times => {
  return {
    cooldown: getNextTime(comps, entity),
    last: getLastTime(comps, entity),
    start: getStartTime(comps, entity),
  };
};
