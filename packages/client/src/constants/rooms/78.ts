import { bgPlaytestDay } from 'assets/images/rooms/78_toadstool-platforms';
import { k11 } from 'assets/sound/ost';
import { Room } from './types';

export const room78: Room = {
  index: 78,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'k11',
    path: k11,
  },
  objects: [],
};
