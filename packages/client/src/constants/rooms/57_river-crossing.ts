import {
  bgPlaytestDay,
  bgPlaytestEvening,
  // bgPlaytestNight,
  bgXmasNight,
} from 'assets/images/rooms/57_river-crossing';
import { arrival } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room57: Room = {
  index: 57,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgXmasNight],
  music: {
    key: 'arrival',
    path: arrival,
  },
  objects: [],
};
