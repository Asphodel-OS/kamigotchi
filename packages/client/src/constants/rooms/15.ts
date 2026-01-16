import { bgPlaytestDay } from 'assets/images/rooms/15_temple-cave';
import { templeCave } from 'assets/sound/ost';
import { Room } from './types';

export const room15: Room = {
  index: 15,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'templeCave',
    path: templeCave,
  },
  objects: [
    {
      name: 'temple exit',
      coordinates: { x1: 53, y1: 110, x2: 75, y2: 128 },
      dialogue: 151,
    },
    {
      name: 'crowned statue',
      coordinates: { x1: 90, y1: 0, x2: 120, y2: 40 },
      dialogue: 154,
    },
    {
      name: 'monk statues 1',
      coordinates: { x1: 0, y1: 70, x2: 30, y2: 120 },
      dialogue: 155,
    },
    {
      name: 'monk statues 2',
      coordinates: { x1: 80, y1: 70, x2: 110, y2: 120 },
      dialogue: 155,
    },
  ],
};
