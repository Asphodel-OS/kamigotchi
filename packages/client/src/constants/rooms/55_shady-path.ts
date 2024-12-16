import {
  bgPlaytestDay,
  bgPlaytestEvening,
  //bgPlaytestNight,
  bgXmasNight,
} from 'assets/images/rooms/55_shady-path';
//import { arrival } from 'assets/sound/ost';
import { Xmas } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room55: Room = {
  index: 55,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgXmasNight],
  music: {
    key: 'Xmas',
    path: Xmas,
  },
  objects: [],
};
