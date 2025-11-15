import { bgPlaytestDay } from 'assets/images/rooms/71_shabby-deck';
import { k11 } from 'assets/sound/ost';
import { Room } from './types';

export const room71: Room = {
  index: 71,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'k11',
    path: k11,
  },
  objects: [],
};
