import { bgPlaytestDay } from 'assets/images/rooms/89_trophies-of-the-hunt';
import { sextantRooms } from 'assets/sound/ost';
import { Room } from './types';

export const room89: Room = {
  index: 89,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'sextantRooms',
    path: sextantRooms,
  },
  objects: [],
};
