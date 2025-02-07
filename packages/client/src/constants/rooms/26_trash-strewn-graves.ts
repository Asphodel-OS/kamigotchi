import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/26_trash-strewn-graves';
import { cave } from 'assets/sound/ost';
import { Room } from './types';

export const room26: Room = {
  index: 26,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
