import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/64_burning-room';
import { arrival } from 'assets/sound/ost';

import { Room } from './types';

export const room64: Room = {
  index: 64,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'arrival',
    path: arrival,
  },
  objects: [
    {
      name: 'hut exit',
      coordinates: { x1: 52, y1: 110, x2: 76, y2: 130 },
      dialogue: 641,
    },
  ],
};
