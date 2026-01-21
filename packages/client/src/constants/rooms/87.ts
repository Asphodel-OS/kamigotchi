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
      coordinates: { x1: 25, y1: 85, x2: 105, y2: 128 },
      dialogue: 871,
    },
    {
      name: 'pillar left',
      coordinates: { x1: 0, y1: 36, x2: 12, y2: 117 },
      dialogue: 872,
    },
    {
      name: 'pillar right',
      coordinates: { x1: 116, y1: 57, x2: 128, y2: 120 },
      dialogue: 872,
    },
  ],
};
