import { bgPlaytestDay } from 'assets/images/rooms/88_treasure-hoard';
import { k11 } from 'assets/sound/ost';
import { Room } from './types';

export const room88: Room = {
  index: 88,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'k11',
    path: k11,
  },
  objects: [],
};
