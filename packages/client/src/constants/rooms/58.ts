import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/58_mouth-of-scrap';
import { k1 } from 'assets/sound/ost';
import { Room } from './types';

export const room58: Room = {
  index: 58,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'k1',
    path: k1,
  },
  objects: [],
};
