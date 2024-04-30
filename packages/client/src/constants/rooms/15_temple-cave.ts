import { bgPlaytest } from 'assets/images/rooms/15_temple-cave';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room15: Room = {
  roomIndex: 15,
  background: {
    key: 'bg_room15',
    path: bgPlaytest,
  },
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [
    // {
    //   // templegrass
    //   coordinates: { x1: 0, y1: 0, x2: 20, y2: 20 },
    //   dialogue: 151,
    // },
    // {
    //   // templedoor
    //   coordinates: { x1: 0, y1: 0, x2: 20, y2: 20 },
    //   dialogue: 152,
    // },
    // {
    //   // templecave
    //   coordinates: { x1: 0, y1: 0, x2: 20, y2: 20 },
    //   dialogue: 153,
    // },
  ],
};
