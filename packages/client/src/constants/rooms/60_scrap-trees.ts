import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/60_scrap-trees';
import { k1 } from 'assets/sound/ost';

import { Room } from './types';

export const room60: Room = {
  index: 60,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'k1',
    path: k1,
  },
  objects: [],
};
