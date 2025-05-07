import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/48_forest-road-iv';
import { k11 } from 'assets/sound/ost';
import { Room } from './types';

export const room48: Room = {
  index: 48,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'k11',
    path: k11,
  },
  objects: [],
};
