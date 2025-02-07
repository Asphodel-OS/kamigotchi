import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/52_airplane_crash';
import { cave } from 'assets/sound/ost';
import { Room } from './types';

export const room52: Room = {
  index: 52,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [
    {
      name: 'plane entrance',
      coordinates: { x1: 30, y1: 64, x2: 50, y2: 82 },
      dialogue: 521,
    },
  ],
};
