import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/32_road-to-labs';
import { cave } from 'assets/sound/ost';
import { Room } from './types';

export const room32: Room = {
  index: 32,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
