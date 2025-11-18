import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/59_black-pool';
import { k14 } from 'assets/sound/ost';
import { Room } from './types';

export const room59: Room = {
  index: 59,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'k14',
    path: k14,
  },
  objects: [],
};
