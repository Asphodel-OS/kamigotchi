import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/36_forest-road-ii';
import { cave } from 'assets/sound/ost';
import { Room } from './types';

export const room36: Room = {
  index: 36,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
