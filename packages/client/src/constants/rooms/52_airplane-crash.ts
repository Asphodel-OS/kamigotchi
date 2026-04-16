import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/52_airplane_crash';
import { k2 } from 'assets/sound/ost';
import { Room } from './types';

export const room52: Room = {
  index: 52,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'k2',
    path: k2,
  },
  objects: [
    {
      name: 'plane entrance',
      coordinates: { x1: 30, y1: 64, x2: 50, y2: 82 },
      dialogue: 521,
    },
    {
      name: 'airplane',
      coordinates: { x1: 54, y1: 62, x2: 91, y2: 74 },
      dialogue: 522,
    },
    {
      name: 'tail fin symbol',
      coordinates: { x1: 99, y1: 47, x2: 116, y2: 67 },
      dialogue: 523,
    },
    {
      name: 'broken trees',
      coordinates: { x1: 65, y1: 85, x2: 128, y2: 128 },
      dialogue: 524,
    },
  ],
};
