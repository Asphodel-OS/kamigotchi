import { bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight } from 'assets/images/rooms/9_forest';
import { glitter } from 'assets/sound/ost';
import { Room } from './types';

export const room09: Room = {
  index: 9,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'glitter',
    path: glitter,
  },
  objects: [
    {
      name: 'beetle1',
      coordinates: { x1: 0, y1: 42, x2: 10, y2: 56 },
      dialogue: 91,
    },
    {
      name: 'beetle2',
      coordinates: { x1: 66, y1: 48, x2: 85, y2: 66 },
      dialogue: 92,
    },
    {
      name: 'beetle3',
      coordinates: { x1: 110, y1: 3, x2: 125, y2: 19 },
      dialogue: 93,
    },
    {
      name: 'beetle4',
      coordinates: { x1: 103, y1: 62, x2: 112, y2: 70 },
      dialogue: 94,
    },
    {
      name: 'smallmushrooms',
      coordinates: { x1: 5, y1: 117, x2: 19, y2: 127 },
      dialogue: 95,
    },
  ],
};
