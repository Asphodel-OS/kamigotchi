import { bgPlaytestDay } from 'assets/images/rooms/18_cave-crossroads';
import { k11 } from 'assets/sound/ost';
import { Room } from './types';

export const room18: Room = {
  index: 18,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'k11',
    path: k11,
  },
  objects: [],
};
