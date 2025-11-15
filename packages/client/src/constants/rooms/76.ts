import { bgPlaytestDay } from 'assets/images/rooms/76_fungus-garden';
import { k11 } from 'assets/sound/ost';
import { Room } from './types';

export const room76: Room = {
  index: 76,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'k11',
    path: k11,
  },
  objects: [],
};
