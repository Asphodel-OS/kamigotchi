import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/51_scrap_littered_undergrowth';
import { k4 } from 'assets/sound/ost';
import { Room } from './types';

export const room51: Room = {
  index: 51,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'k4',
    path: k4,
  },
  objects: [],
};
