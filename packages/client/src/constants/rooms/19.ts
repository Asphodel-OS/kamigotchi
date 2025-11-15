import { bgPlaytestDay } from 'assets/images/rooms/19_temple-of-the-wheel';
import { k11 } from 'assets/sound/ost';
import { Room } from './types';

export const room19: Room = {
  index: 19,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'k11',
    path: k11,
  },
  objects: [],
};
