import { bgChristmas } from 'assets/images/rooms/68_slippery-pit';
import { slipperyPit } from 'assets/sound/ost';
import { Room } from './types';

export const room68: Room = {
  index: 68,
  backgrounds: [bgChristmas],
  music: {
    key: 'slipperyPit',
    path: slipperyPit,
  },
  objects: [],
};
