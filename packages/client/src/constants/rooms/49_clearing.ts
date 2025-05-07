import { bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight } from 'assets/images/rooms/49_clearing';
import { Room } from './types';

export const room49: Room = {
  index: 49,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  objects: [
    {
      name: 'gate',
      coordinates: { x1: 40, y1: 40, x2: 75, y2: 110 },
      dialogue: 491,
    },
  ],
};
