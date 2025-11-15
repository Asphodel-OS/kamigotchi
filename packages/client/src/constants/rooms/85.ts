import { bgPlaytestDay } from 'assets/images/rooms/85_giants-palm';
import { k11 } from 'assets/sound/ost';
import { Room } from './types';

export const room85: Room = {
  index: 85,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'k11',
    path: k11,
  },
  objects: [],
};
