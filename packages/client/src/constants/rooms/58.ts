import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/58_mouth-of-scrap';
import { k11 } from 'assets/sound/ost';
import { Room } from './types';

export const room58: Room = {
  index: 58,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'k11',
    path: k11,
  },
  objects: [],
};
