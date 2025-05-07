import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/53_blooming-tree';
import { k9 } from 'assets/sound/ost';
import { Room } from './types';

export const room53: Room = {
  index: 53,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'k9',
    path: k9,
  },
  objects: [],
};
