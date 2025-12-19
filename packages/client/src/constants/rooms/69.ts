import { bgChristmas } from 'assets/images/rooms/69_lotus-pool';
import { lotusPool } from 'assets/sound/ost';
import { Room } from './types';

export const room69: Room = {
  index: 69,
  backgrounds: [bgChristmas],
  music: {
    key: 'lotusPool',
    path: lotusPool,
  },
  objects: [],
};
