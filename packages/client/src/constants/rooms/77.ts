import { bgPlaytestDay } from 'assets/images/rooms/77_thriving-mushrooms';
import { k11 } from 'assets/sound/ost';
import { Room } from './types';

export const room77: Room = {
  index: 77,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'k11',
    path: k11,
  },
  objects: [],
};
