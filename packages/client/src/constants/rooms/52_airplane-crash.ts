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
      coordinates: { x1: 0, y1: 0, x2: 0, y2: 0 },
      dialogue: 522,
    },
    {
      name: 'tail fin symbol',
      coordinates: { x1: 0, y1: 0, x2: 0, y2: 0 },
      dialogue: 523,
    },
    {
      name: 'broken trees',
      coordinates: { x1: 0, y1: 0, x2: 0, y2: 0 },
      dialogue: 524,
    },
  ],
};
