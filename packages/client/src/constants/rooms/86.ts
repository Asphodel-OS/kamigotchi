import { bgPlaytestDay } from 'assets/images/rooms/86_guardian-skull';
import { guardianSkull } from 'assets/sound/ost';
import { Room } from './types';

export const room86: Room = {
  index: 86,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'guardianSkull',
    path: guardianSkull,
  },
  objects: [
    {
      name: 'ribcage pit',
      coordinates: { x1: 0, y1: 0, x2: 0, y2: 0 },
      dialogue: 861,
    },
    {
      name: 'giant skull',
      coordinates: { x1: 0, y1: 0, x2: 0, y2: 0 },
      dialogue: 862,
    },
  ],
};
