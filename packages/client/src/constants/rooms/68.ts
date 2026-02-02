import { bgPlaytestDay } from 'assets/images/rooms/68_slippery-pit';
import { slipperyPit } from 'assets/sound/ost';
import { Room } from './types';

export const room68: Room = {
  index: 68,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'slipperyPit',
    path: slipperyPit,
  },
  objects: [
    {
      name: 'Ladder up',
      coordinates: { x1: 3, y1: 34, x2: 36, y2: 109 },
      dialogue: 681,
    },
    {
      name: 'Dark Pit',
      coordinates: { x1: 50, y1: 90, x2: 100, y2: 128 },
      dialogue: 682,
    },
  ],
};
