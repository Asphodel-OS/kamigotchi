import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/59_black-pool';
import { k11 } from 'assets/sound/ost';
import { Room } from './types';

export const room59: Room = {
  index: 59,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'k11',
    path: k11,
  },
  objects: [],
};
