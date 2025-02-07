import { bgPlaytest } from 'assets/images/rooms/7_office-lobby';
import { abandoned } from 'assets/sound/ost';
import { Room } from './types';

export const room07: Room = {
  index: 7,
  backgrounds: [bgPlaytest],
  music: {
    key: 'abandoned',
    path: abandoned,
  },
  objects: [
    // {
    //   // chair
    //   coordinates: { x1: 0, y1: 0, x2: 20, y2: 20 },
    //   dialogue: 71,
    // },
    // {
    //   // cabinet
    //   coordinates: { x1: 0, y1: 0, x2: 20, y2: 20 },
    //   dialogue: 72,
    // },
  ],
};
