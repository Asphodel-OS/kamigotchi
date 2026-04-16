import { bgPlaytestDay } from 'assets/images/rooms/80_radiant-crystal';
import { radiantCrystal } from 'assets/sound/ost';
import { Room } from './types';

export const room80: Room = {
  index: 80,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'radiantCrystal',
    path: radiantCrystal,
  },
  objects: [
    {
      name: 'crystal',
      coordinates: { x1: 35, y1: 15, x2: 95, y2: 85 },
      dialogue: 801,
    },
  ],
};
