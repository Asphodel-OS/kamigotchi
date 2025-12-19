import { bgChristmasNight, bgPlaytestDay } from 'assets/images/rooms/29_road-out-of-woods';
import { cave } from 'assets/sound/ost';
import { Room } from './types';

export const room29: Room = {
  index: 29,
  backgrounds: [bgPlaytestDay, bgChristmasNight, bgChristmasNight],
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
