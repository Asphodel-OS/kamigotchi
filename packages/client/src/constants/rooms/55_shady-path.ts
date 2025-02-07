import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/55_shady-path';
import { arrival } from 'assets/sound/ost';
import { Room } from './types';

export const room55: Room = {
  index: 55,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'arrival',
    path: arrival,
  },
  objects: [],
};
