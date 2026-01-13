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
  objects: [
    {
      name: 'bisected notebook',
      coordinates: { x1: 0, y1: 0, x2: 0, y2: 0 },
      dialogue: 601,
    },
    {
      name: 'bisected shovel',
      coordinates: { x1: 0, y1: 0, x2: 0, y2: 0 },
      dialogue: 602,
    },
  ],
};
