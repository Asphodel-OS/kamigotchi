import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/66_trading-room';
import { arrival } from 'assets/sound/ost';

import { Room } from './types';

export const room66: Room = {
  index: 66,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'arrival',
    path: arrival,
  },
  objects: [
    {
      name: 'trading-room',
      coordinates: { x1: 25, y1: 40, x2: 90, y2: 110 },
      dialogue: 661,
    },
  ],
};
