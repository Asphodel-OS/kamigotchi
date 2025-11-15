import { bgPlaytestDay } from 'assets/images/rooms/73_broken-tube';
import { k11 } from 'assets/sound/ost';
import { Room } from './types';

export const room73: Room = {
  index: 73,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'k11',
    path: k11,
  },
  objects: [],
};
