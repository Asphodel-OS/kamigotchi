import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/5_restricted';
import { amusement } from 'assets/sound/ost';
import { Room } from './types';

export const room05: Room = {
  index: 5,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'amusement',
    path: amusement,
  },
  objects: [
    {
      name: 'trash bag',
      coordinates: { x1: 0, y1: 102, x2: 17, y2: 126 },
      dialogue: 51,
    },
    {
      name: 'company building',
      coordinates: { x1: 18, y1: 9, x2: 49, y2: 58 },
      dialogue: 52,
    },
    {
      name: 'warning sign',
      coordinates: { x1: 60, y1: 97, x2: 89, y2: 111 },
      dialogue: 53,
    },
  ],
};
