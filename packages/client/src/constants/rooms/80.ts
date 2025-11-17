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
  objects: [],
};
