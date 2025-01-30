import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/29_road-out-of-woods';
import { cave } from 'assets/sound/ost';

import { Room } from 'constants/rooms';

export const room29: Room = {
  index: 29,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
