import { bgPlaytest, objectMooringPost } from 'assets/images/rooms/1_misty-river';
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
      key: 'mooringpost',
      path: objectMooringPost,
      offset: { x: -19, y: 38 },
      dialogue: 11,
    },
  ],
};
