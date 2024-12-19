import {
  //bgPlaytestNight,
  bgXmasNight,
} from 'assets/images/rooms/56_butterfly-forest';
//import { arrival } from 'assets/sound/ost';
import { Xmas } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room56: Room = {
  index: 56,
  backgrounds: [bgXmasNight],
  music: {
    key: 'Xmas',
    path: Xmas,
  },
  objects: [],
};
