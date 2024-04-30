import { bgPlaytest } from 'assets/images/rooms/18_cave-crossroads';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room18: Room = {
  roomIndex: 18,
  background: {
    key: 'bg_room18',
    path: bgPlaytest,
  },
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
