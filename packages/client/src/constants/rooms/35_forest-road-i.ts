import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/35_forest-road-i';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room35: Room = {
  index: 35,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
