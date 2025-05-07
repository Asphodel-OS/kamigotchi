import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/62_centipedes';
import { k5 } from 'assets/sound/ost';

import { Room } from './types';

export const room62: Room = {
  index: 62,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'k5',
    path: k5,
  },
  objects: [],
};
