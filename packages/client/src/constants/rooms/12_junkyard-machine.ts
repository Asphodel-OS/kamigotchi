import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/12_junkyard-machine';
import { k1 } from 'assets/sound/ost';
import { Room } from './types';

export const room12: Room = {
  index: 12,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'k1',
    path: k1,
  },
  objects: [
    {
      name: 'bell shaped device',
      coordinates: { x1: 85, y1: 20, x2: 130, y2: 80 },
      dialogue: 121,
    },
  ],
};
