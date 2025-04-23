import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/65_forest-hut';
import { arrival } from 'assets/sound/ost';

import { Room } from './types';

export const room65: Room = {
  index: 65,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'arrival',
    path: arrival,
  },
  objects: [],
};
