import { bgPlaytestDay } from 'assets/images/rooms/70_still-stream';
import { k11 } from 'assets/sound/ost';
import { Room } from './types';

export const room70: Room = {
  index: 70,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'k11',
    path: k11,
  },
  objects: [],
};
