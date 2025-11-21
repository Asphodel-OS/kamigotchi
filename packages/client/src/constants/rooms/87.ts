import { bgPlaytestDay } from 'assets/images/rooms/87_sacrarium';
import { sacrarium } from 'assets/sound/ost';
import { Room } from './types';

export const room87: Room = {
  index: 87,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'sacrarium',
    path: sacrarium,
  },
  objects: [
    {
      name: 'black pool',
      coordinates: { x1: 0, y1: 0, x2: 0, y2: 0 },
      dialogue: 871,
    },
    {
      name: 'pillars',
      coordinates: { x1: 0, y1: 0, x2: 0, y2: 0 },
      dialogue: 872,
    },
  ],
};
