import { bgPlaytest } from 'assets/images/rooms/16_techno-temple';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room16: Room = {
  roomIndex: 16,
  background: {
    key: 'bg_room16',
    path: bgPlaytest,
  },
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [
    // {
    //   coordinates: { x1: 0, y1: 0, x2: 20, y2: 20 },
    //   dialogue: 161,
    // },
  ],
};
