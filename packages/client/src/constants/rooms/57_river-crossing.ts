import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/57_river-crossing';
import { arrival } from 'assets/sound/ost';

import { Room } from 'constants/rooms';

export const room57: Room = {
  index: 57,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'arrival',
    path: arrival,
  },
  objects: [],
};
