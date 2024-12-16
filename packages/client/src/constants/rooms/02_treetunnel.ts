/* import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/2_tree-tunnel';*/
import { bgXmasDay, bgXmasEvening, bgXmasNight } from 'assets/images/rooms/2_tree-tunnel';
import { arrival } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room02: Room = {
  index: 2,
  backgrounds: [bgXmasDay, bgXmasEvening, bgXmasNight],
  music: {
    key: 'arrival',
    path: arrival,
  },
  objects: [
    {
      name: 'hollow stump',
      coordinates: { x1: 0, y1: 70, x2: 31, y2: 115 },
      dialogue: 21,
    },
    {
      name: 'torii gate',
      coordinates: { x1: 16, y1: 23, x2: 33, y2: 40 },
      dialogue: 22,
    },
    {
      name: 'shop door',
      coordinates: { x1: 55, y1: 32, x2: 83, y2: 82 },
      dialogue: 23,
    },
  ],
};
