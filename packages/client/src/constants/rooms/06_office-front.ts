import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/6_office-front';
import { amusement } from 'assets/sound/ost';
import { Room } from './types';

export const room06: Room = {
  index: 6,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'amusement',
    path: amusement,
  },
  objects: [
    {
      name: 'building logo',
      coordinates: { x1: 49, y1: 4, x2: 79, y2: 34 },
      dialogue: 61,
    },
    {
      name: 'fox statue 1',
      coordinates: { x1: 1, y1: 63, x2: 38, y2: 120 },
      dialogue: 62,
    },
    {
      name: 'fox statue 2',
      coordinates: { x1: 90, y1: 63, x2: 128, y2: 120 },
      dialogue: 62,
    },
  ],
};
