import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/56_butterfly-forest';
import { arrival } from 'assets/sound/ost';

import { Room } from 'constants/rooms';

export const room56: Room = {
  index: 56,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'arrival',
    path: arrival,
  },
  objects: [],
};
