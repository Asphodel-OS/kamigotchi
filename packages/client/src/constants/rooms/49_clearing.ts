import { bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight } from 'assets/images/rooms/49_clearing';
import { k13 } from 'assets/sound/ost';
import { Room } from './types';

export const room49: Room = {
  index: 49,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'k13',
    path: k13,
  },
  objects: [
    {
      name: 'gate',
      coordinates: { x1: 40, y1: 40, x2: 75, y2: 110 },
      dialogue: 491,
    },
  ],
};
