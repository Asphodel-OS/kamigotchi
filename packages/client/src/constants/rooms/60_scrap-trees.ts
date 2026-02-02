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
      coordinates: { x1: 54, y1: 92, x2: 70, y2: 100 },
      dialogue: 601,
    },
    {
      name: 'bisected shovel',
      coordinates: { x1: 33, y1: 102, x2: 72, y2: 116 },
      dialogue: 602,
    },
  ],
};
