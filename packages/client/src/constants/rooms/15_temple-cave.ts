import {
  backgroundDefault,
  path11,
  path16,
  path18
} from 'assets/images/rooms/15_temple-cave';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';


export const room15: Room = {
  location: 15,
  background: {
    key: 'bg_room15',
    path: backgroundDefault,
  },
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [
    {
      key: 'templegrass',
      path: path11,
      offset: { x: -8.5, y: 57 },
      dialogue: 151,
    },
    {
      key: 'templedoor',
      path: path16,
      offset: { x: 41.3, y: -8.7 },
      dialogue: 152,
    },
    {
      key: 'templecave',
      path: path18,
      offset: { x: -18, y: -15 },
      dialogue: 153,
    },
  ],
};