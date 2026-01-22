import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/25_lost-skeleton';
import { k13 } from 'assets/sound/ost';
import { Room } from './types';

export const room25: Room = {
  index: 25,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'k13',
    path: k13,
  },
  objects: [
    {
      name: '1997 laptop',
      coordinates: { x1: 52, y1: 95, x2: 65, y2: 109 },
      dialogue: 251,
    },
    {
      name: 'skeleton in wide-leg jeans',
      coordinates: { x1: 70, y1: 75, x2: 115, y2: 110 },
      dialogue: 252,
    },
  ],
};
