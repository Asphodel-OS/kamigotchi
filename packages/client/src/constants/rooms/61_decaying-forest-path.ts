import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/61_decaying-forest-path';
import { k4 } from 'assets/sound/ost';

import { Room } from './types';

export const room61: Room = {
  index: 61,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'k4',
    path: k4,
  },
  objects: [],
};
