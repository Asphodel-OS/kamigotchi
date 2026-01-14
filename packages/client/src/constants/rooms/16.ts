import { bgPlaytestDay } from 'assets/images/rooms/16_techno-temple';
import { technoTemple } from 'assets/sound/ost';
import { Room } from './types';

export const room16: Room = {
  index: 16,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'technoTemple',
    path: technoTemple,
  },
  objects: [],
};
