import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/57_river-crossing';
import { k8 } from 'assets/sound/ost';

import { Room } from './types';

export const room57: Room = {
  index: 57,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'k8',
    path: k8,
  },
  objects: [],
};
