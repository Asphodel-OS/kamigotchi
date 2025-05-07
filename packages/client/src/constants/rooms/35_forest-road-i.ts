import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/35_forest-road-i';
import { k4 } from 'assets/sound/ost';
import { Room } from './types';

export const room35: Room = {
  index: 35,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'k4',
    path: k4,
  },
  objects: [],
};
