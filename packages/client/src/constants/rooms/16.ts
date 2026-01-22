import { bgPlaytestDay } from 'assets/images/rooms/16_techno-temple';
import { technoTemple } from 'assets/sound/ost';
import { Room } from './types';

export const room16: Room = {
  index: 16,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'technoTemple',
    path: technoTemple,
  },
  objects: [
    {
      name: 'offering box',
      coordinates: { x1: 45, y1: 90, x2: 80, y2: 120 },
      dialogue: 162,
    },
    {
      name: 'crt monitor',
      coordinates: { x1: 53, y1: 35, x2: 75, y2: 55 },
      dialogue: 163,
    },
  ],
};
