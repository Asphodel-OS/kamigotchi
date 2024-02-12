import {
  backgroundDefault,
  backgroundOld,
  objectMonitors,
  objectPoster,
  objectVendingWall,
} from 'assets/images/rooms/8_junkshop';
import { abandoned } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room8: Room = {
  location: 8,
  background: {
    key: 'bg_room008',
    path: backgroundDefault,
  },
  music: {
    key: 'abandoned',
    path: abandoned,
  },
  objects: [
    {
      key: 'junkmonitors',
      path: objectMonitors,
      offset: { x: 54, y: 17 },
      dialogue: 81,
    },
    {
      key: 'junkvendingwall',
      path: objectVendingWall,
      offset: { x: -47.5, y: -4.5 },
      dialogue: 82,
    },
    {
      key: 'poster',
      path: objectPoster,
      offset: { x: 35.5, y: -1.4 },
      dialogue: 83,
    },
  ],
};
