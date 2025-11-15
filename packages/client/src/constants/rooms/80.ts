import { bgPlaytestDay } from 'assets/images/rooms/80_radiant-crystal';
import { k11 } from 'assets/sound/ost';
import { Room } from './types';

export const room80: Room = {
  index: 80,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'k11',
    path: k11,
  },
  objects: [],
};
