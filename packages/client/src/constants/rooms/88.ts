import { bgPlaytestDay } from 'assets/images/rooms/88_treasure-hoard';
import { sextantRooms } from 'assets/sound/ost';
import { Room } from './types';

export const room88: Room = {
  index: 88,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'sextantRooms',
    path: sextantRooms,
  },
  objects: [
    {
      name: 'exit',
      coordinates: { x1: 105, y1: 20, x2: 125, y2: 130 },
      dialogue: 881,
    },
  ],
};
