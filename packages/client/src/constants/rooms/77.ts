import { bgPlaytestDay } from 'assets/images/rooms/77_thriving-mushrooms';
import { thrivingMushrooms } from 'assets/sound/ost';
import { Room } from './types';

export const room77: Room = {
  index: 77,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'thrivingMushrooms',
    path: thrivingMushrooms,
  },
  objects: [],
};
