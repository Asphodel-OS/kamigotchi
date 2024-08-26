import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/53_blooming-tree';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room53: Room = {
  index: 53,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
