import { bgPlaytest } from 'assets/images/rooms/1_misty-river';
import { arrival } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room01: Room = {
  roomIndex: 1,
  background: {
    key: 'bg_room001',
    path: bgPlaytest,
  },
  music: {
    key: 'arrival',
    path: arrival,
  },
  objects: [
    {
      name: 'mooring post',
      coordinates: { x1: 40, y1: 87, x2: 50, y2: 106 }, // TODO: remove this once room objects are cleaned up
      dialogue: 11,
    },
  ],
};
