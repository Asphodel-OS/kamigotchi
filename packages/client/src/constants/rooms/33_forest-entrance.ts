import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/33_forest-entrance';
import { k11 } from 'assets/sound/ost';
import { Room } from './types';

export const room33: Room = {
  index: 33,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'k11',
    path: k11,
  },
  objects: [],
};
