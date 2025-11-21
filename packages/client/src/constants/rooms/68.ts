import { bgChristmas } from 'assets/images/rooms/68_slippery-pit';
import { slipperyPit } from 'assets/sound/ost';
import { Room } from './types';

export const room68: Room = {
  index: 68,
  backgrounds: [bgChristmas],
  music: {
    key: 'slipperyPit',
    path: slipperyPit,
  },
  objects: [
    {
      name: 'Ladder up',
      coordinates: { x1: 0, y1: 0, x2: 0, y2: 0 },
      dialogue: 681,
    },
    {
      name: 'Dark Pit',
      coordinates: { x1: 0, y1: 0, x2: 0, y2: 0 },
      dialogue: 682,
    },
  ],
};
