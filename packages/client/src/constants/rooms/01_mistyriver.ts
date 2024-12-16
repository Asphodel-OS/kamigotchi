//import { bgPlaytest } from 'assets/images/rooms/1_misty-river';
import { bgXmas } from 'assets/images/rooms/1_misty-river';
//import { arrival } from 'assets/sound/ost';
import { Xmas } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room01: Room = {
  index: 1,
  backgrounds: [bgXmas],
  music: {
    key: 'Xmas',
    path: Xmas,
  },
  objects: [
    {
      name: 'mooring post',
      coordinates: { x1: 40, y1: 87, x2: 50, y2: 106 }, // TODO: remove this once room objects are cleaned up
      dialogue: 11,
    },
  ],
};
