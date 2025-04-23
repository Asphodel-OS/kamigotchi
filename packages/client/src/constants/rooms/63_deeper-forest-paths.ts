import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/63_deeper-forest-paths';
import { arrival } from 'assets/sound/ost';

import { Room } from './types';

export const room63: Room = {
  index: 63,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'arrival',
    path: arrival,
  },
  objects: [],
};
