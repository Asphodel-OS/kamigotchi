import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/50_ancient_forest_entrance';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room50: Room = {
  index: 50,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
