import { bgPlaytest } from 'assets/images/rooms/18_cave-crossroads';
import { cave } from 'assets/sound/ost';
import { Room } from './types';

export const room18: Room = {
  index: 18,
  backgrounds: [bgPlaytest],
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [
    // {
    //   // cavefloor
    //   coordinates: { x1: 0, y1: 0, x2: 20, y2: 20 },
    //   dialogue: 181,
    // },
    // {
    //   // cavecrossleft
    //   coordinates: { x1: 0, y1: 0, x2: 20, y2: 20 },
    //   dialogue: 182,
    // },
    // {
    //   // cavecrossright
    //   coordinates: { x1: 0, y1: 0, x2: 20, y2: 20 },
    //   dialogue: 183,
    // },
  ],
};
