import {
  backgroundSign,
  objectMooringPost,
} from 'assets/images/rooms/1_misty-river';
import { opening } from 'assets/sound/ost';
import { Room } from 'constants/phaser/rooms';

export const room1: Room = {
  location: 1,
  background: {
    key: 'bg_room001',
    path: backgroundSign,
  },
  music: {
    key: 'opening',
    path: opening,
  },
  objects: [
    {
      key: 'mooringpost',
      path: objectMooringPost,
      offset: { x: -19, y: 38 },
      dialogue: [
        "You see what looks like a mooring post with rope attached to it. You don't remember a boat, but how else would you have gotten here?",
      ],
    },
  ],
};