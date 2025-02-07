import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/48_forest-road-iv';
import { cave } from 'assets/sound/ost';
import { Room } from './types';

export const room48: Room = {
  index: 48,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
