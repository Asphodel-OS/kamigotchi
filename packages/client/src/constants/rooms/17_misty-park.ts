import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/17_misty-park';
import { cave } from 'assets/sound/ost';

import { Room } from 'constants/rooms';

export const room17: Room = {
  index: 17,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
