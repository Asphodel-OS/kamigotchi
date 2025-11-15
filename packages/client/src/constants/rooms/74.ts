import { bgPlaytestDay } from 'assets/images/rooms/74_engraved-door';
import { k11 } from 'assets/sound/ost';
import { Room } from './types';

export const room74: Room = {
  index: 74,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'k11',
    path: k11,
  },
  objects: [],
};
