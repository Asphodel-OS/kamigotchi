import { bgChristmas } from 'assets/images/rooms/16_techno-temple';
import { technoTemple } from 'assets/sound/ost';
import { Room } from './types';

export const room16: Room = {
  index: 16,
  backgrounds: [bgChristmas],
  music: {
    key: 'technoTemple',
    path: technoTemple,
  },
  objects: [
    {
      name: 'offering box',
      coordinates: { x1: 0, y1: 0, x2: 0, y2: 0 },
      dialogue: 162,
    },
    {
      name: 'crt monitor',
      coordinates: { x1: 0, y1: 0, x2: 0, y2: 0 },
      dialogue: 163,
    },
  ],
};
