import { bgChristmas } from 'assets/images/rooms/18_cave-crossroads';
import { caveCrossroads } from 'assets/sound/ost';
import { Room } from './types';

export const room18: Room = {
  index: 18,
  backgrounds: [bgChristmas],
  music: {
    key: 'caveCrossroads',
    path: caveCrossroads,
  },
  objects: [
    {
      name: 'hanging bell',
      coordinates: { x1: 0, y1: 0, x2: 0, y2: 0 },
      dialogue: 184,
    },
  ],
};
