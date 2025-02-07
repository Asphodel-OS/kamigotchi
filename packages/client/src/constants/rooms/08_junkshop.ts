import { bgPlaytest } from 'assets/images/rooms/8_junkshop';
import { abandoned } from 'assets/sound/ost';
import { Room } from './types';

export const room08: Room = {
  index: 8,
  backgrounds: [bgPlaytest],
  music: {
    key: 'abandoned',
    path: abandoned,
  },
  objects: [
    // {
    //   // junkmonitors
    //   coordinates: { x1: 0, y1: 0, x2: 20, y2: 20 },
    //   dialogue: 81,
    // },
    // {
    //   // junkvendingwall
    //   coordinates: { x1: 0, y1: 0, x2: 20, y2: 20 },
    //   dialogue: 82,
    // },
    // {
    //   // poster
    //   coordinates: { x1: 0, y1: 0, x2: 20, y2: 20 },
    //   dialogue: 83,
    // },
  ],
};
