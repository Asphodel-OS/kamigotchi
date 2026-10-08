import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/34_deeper-into-scrap';
import { k1 } from 'assets/sound/ost';
import { Room } from './types';

export const room34: Room = {
  index: 34,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'k1',
    path: k1,
  },
  objects: [],
};
