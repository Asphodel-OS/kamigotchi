import { bgPlaytestDay } from 'assets/images/rooms/18_cave-crossroads';
import { caveCrossroads } from 'assets/sound/ost';
import { Room } from './types';

export const room18: Room = {
  index: 18,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'caveCrossroads',
    path: caveCrossroads,
  },
  objects: [
    {
      name: 'hanging bell',
      coordinates: { x1: 47, y1: 15, x2: 65, y2: 45 },
      dialogue: 184,
    },
  ],
};
