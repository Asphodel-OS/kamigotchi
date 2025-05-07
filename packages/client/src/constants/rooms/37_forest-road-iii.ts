import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/37_forest-road-iii';
import { k13 } from 'assets/sound/ost';
import { Room } from './types';

export const room37: Room = {
  index: 37,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'k13',
    path: k13,
  },
  objects: [],
};
