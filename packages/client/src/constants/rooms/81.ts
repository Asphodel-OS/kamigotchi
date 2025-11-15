import { bgPlaytestDay } from 'assets/images/rooms/81_flower-mural';
import { k11 } from 'assets/sound/ost';
import { Room } from './types';

export const room81: Room = {
  index: 81,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'k11',
    path: k11,
  },
  objects: [],
};
