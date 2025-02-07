import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/46_parking-lot';
import { cave } from 'assets/sound/ost';
import { Room } from './types';

export const room46: Room = {
  index: 46,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
