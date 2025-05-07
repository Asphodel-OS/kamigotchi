import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/63_deeper-forest-paths';
import { k8 } from 'assets/sound/ost';

import { Room } from './types';

export const room63: Room = {
  index: 63,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'k8',
    path: k8,
  },
  objects: [],
};
