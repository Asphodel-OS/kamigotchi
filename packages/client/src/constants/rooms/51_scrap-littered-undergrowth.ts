import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/51_scrap_littered_undergrowth';
import { cave } from 'assets/sound/ost';
import { Room } from './types';

export const room51: Room = {
  index: 51,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
