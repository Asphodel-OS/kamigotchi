import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/25_lost-skeleton';
import { cave } from 'assets/sound/ost';
import { Room } from './types';

export const room25: Room = {
  index: 25,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
