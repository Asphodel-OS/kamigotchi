import { bgPlaytestDay } from 'assets/images/rooms/68_slippery-pit';
import { k11 } from 'assets/sound/ost';
import { Room } from './types';

export const room68: Room = {
  index: 68,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'k11',
    path: k11,
  },
  objects: [],
};
