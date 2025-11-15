import { bgPlaytestDay } from 'assets/images/rooms/84_reinforced-tunnel';
import { k11 } from 'assets/sound/ost';
import { Room } from './types';

export const room84: Room = {
  index: 84,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'k11',
    path: k11,
  },
  objects: [],
};
