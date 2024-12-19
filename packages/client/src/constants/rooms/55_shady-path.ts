import {
  //bgPlaytestNight,
  bgXmasNight,
} from 'assets/images/rooms/55_shady-path';
//import { arrival } from 'assets/sound/ost';
import { Xmas } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room55: Room = {
  index: 55,
  backgrounds: [bgXmasNight],
  music: {
    key: 'Xmas',
    path: Xmas,
  },
  objects: [
    {
      name: 'goat',
      coordinates: { x1: 27, y1: 70, x2: 37, y2: 100 },
      dialogue: 551,
    },
  ],
};
