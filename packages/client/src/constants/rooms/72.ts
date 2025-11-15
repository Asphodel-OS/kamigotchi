import { bgPlaytestDay } from 'assets/images/rooms/72_hatch-to-nowhere';
import { k11 } from 'assets/sound/ost';
import { Room } from './types';

export const room72: Room = {
  index: 72,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'k11',
    path: k11,
  },
  objects: [],
};
