import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/12_junkyard-machine';
import { mystique } from 'assets/sound/ost';
import { Room } from './types';

export const room12: Room = {
  index: 12,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'mystique',
    path: mystique,
  },
  objects: [
    {
      name: 'bell shaped device',
      coordinates: { x1: 85, y1: 20, x2: 130, y2: 80 },
      dialogue: 121,
    },
  ],
};
