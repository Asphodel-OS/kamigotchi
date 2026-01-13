import { bgPlaytestDay } from 'assets/images/rooms/19_temple-of-the-wheel';
import { templeOfTheWheel } from 'assets/sound/ost';
import { Room } from './types';

export const room19: Room = {
  index: 19,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'templeOfTheWheel',
    path: templeOfTheWheel,
  },
  objects: [
    {
      name: 'black pool',
      coordinates: { x1: 0, y1: 0, x2: 0, y2: 0 },
      dialogue: 192,
    },
  ],
};
