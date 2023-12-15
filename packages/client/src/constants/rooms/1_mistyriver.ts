import {
  backgroundSign,
  objectMooringPost,
} from 'assets/images/rooms/1_misty-river';
import { cave, arrival } from 'assets/sound/ost';
import { Room } from 'constants/rooms';


export const room1: Room = {
  location: 1,
  background: {
    key: 'bg_room001',
    path: backgroundSign,
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