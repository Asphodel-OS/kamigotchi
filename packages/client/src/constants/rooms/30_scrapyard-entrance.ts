import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/30_scrapyard-entrance';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room30: Room = {
  index: 30,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
