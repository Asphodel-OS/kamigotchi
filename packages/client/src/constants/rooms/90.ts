import { bgPlaytestDay } from 'assets/images/rooms/90_scenic-view';
import { k11 } from 'assets/sound/ost';
import { Room } from './types';

export const room90: Room = {
  index: 90,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'k11',
    path: k11,
  },
  objects: [],
};
