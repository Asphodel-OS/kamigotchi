import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/30_scrapyard-entrance';
import { cave } from 'assets/sound/ost';
import { Room } from './types';

export const room30: Room = {
  index: 30,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [
    {
      name: 'kami1',
      coordinates: { x1: 75, y1: 33, x2: 96, y2: 53 },
    },
    {
      name: 'kami2',
      coordinates: { x1: 33, y1: 12, x2: 63, y2: 68 },
    },
    {
      name: 'kami3',
      coordinates: { x1: 83, y1: 17, x2: 111, y2: 32 },
    },
  ],
};
