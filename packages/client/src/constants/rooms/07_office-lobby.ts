import { bgPlaytest } from 'assets/images/rooms/7_office-lobby';
import { abandoned } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room07: Room = {
  roomIndex: 7,
  background: {
    key: 'bg_room007',
    path: bgPlaytest,
  },
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
