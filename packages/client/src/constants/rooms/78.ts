import { bgPlaytestDay } from 'assets/images/rooms/78_toadstool-platforms';
import { toadstoolPlatforms } from 'assets/sound/ost';
import { Room } from './types';

export const room78: Room = {
  index: 78,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'toadstoolPlatforms',
    path: toadstoolPlatforms,
  },
  objects: [
    {
      name: 'rope ladder',
      coordinates: { x1: 0, y1: 0, x2: 0, y2: 0 },
      dialogue: 781,
    },
  ],
};
