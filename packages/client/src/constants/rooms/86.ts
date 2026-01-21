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
      coordinates: { x1: 36, y1: 92, x2: 111, y2: 111 },
      dialogue: 861,
    },
    {
      name: 'giant skull',
      coordinates: { x1: 41, y1: 41, x2: 87, y2: 82 },
      dialogue: 862,
    },
  ],
};
