import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/33_forest-entrance';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room33: Room = {
  index: 33,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
