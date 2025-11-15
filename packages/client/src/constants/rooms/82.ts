import { bgPlaytestDay } from 'assets/images/rooms/82_geometric-cliffs';
import { k11 } from 'assets/sound/ost';
import { Room } from './types';

export const room82: Room = {
  index: 82,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'k11',
    path: k11,
  },
  objects: [],
};
