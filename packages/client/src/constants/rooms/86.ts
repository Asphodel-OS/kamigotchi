import { bgPlaytestDay } from 'assets/images/rooms/86_guardian-skull';
import { k11 } from 'assets/sound/ost';
import { Room } from './types';

export const room86: Room = {
  index: 86,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'k11',
    path: k11,
  },
  objects: [],
};
