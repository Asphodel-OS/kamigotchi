import {
  //bgPlaytestNight,
  bgXmasNight,
} from 'assets/images/rooms/29_road-out-of-woods';
//import { cave } from 'assets/sound/ost';
import { Xmas } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room29: Room = {
  index: 29,
  backgrounds: [bgXmasNight],
  music: {
    key: 'Xmas',
    path: Xmas,
  },
  objects: [],
};
