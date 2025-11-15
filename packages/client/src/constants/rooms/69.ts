import { bgPlaytestDay } from 'assets/images/rooms/69_lotus-pool';
import { k11 } from 'assets/sound/ost';
import { Room } from './types';

export const room69: Room = {
  index: 69,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'k11',
    path: k11,
  },
  objects: [],
};
