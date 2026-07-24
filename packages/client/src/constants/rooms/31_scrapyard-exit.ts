import {
  bgFountainDay,
  bgFountainEvening,
  bgFountainNight,
} from 'assets/images/rooms/31_scrapyard-exit';
import { cave } from 'assets/sound/ost';
import { Room } from './types';

export const room31: Room = {
  index: 31,
  backgrounds: [bgFountainDay, bgFountainEvening, bgFountainNight],
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
