import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/66_trading-room';
import { market } from 'assets/sound/ost';

import { Room } from './types';

export const room66: Room = {
  index: 66,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'market',
    path: market,
  },
  objects: [
    {
      name: 'trading-room',
      coordinates: { x1: 25, y1: 40, x2: 90, y2: 110 },
      dialogue: 661,
    },
    {
      name: 'marketplace tree',
      coordinates: { x1: 0, y1: 0, x2: 0, y2: 0 },
      dialogue: 662,
    },
  ],
};
