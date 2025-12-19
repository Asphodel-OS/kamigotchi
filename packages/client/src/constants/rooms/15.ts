import { bgChristmas } from 'assets/images/rooms/15_temple-cave';
import { templeCave } from 'assets/sound/ost';
import { Room } from './types';

export const room15: Room = {
  index: 15,
  backgrounds: [bgChristmas],
  music: {
    key: 'templeCave',
    path: templeCave,
  },
  objects: [
    {
      name: 'temple exit',
      coordinates: { x1: 30, y1: 100, x2: 100, y2: 150 },
      dialogue: 151,
    },
  ],
};
