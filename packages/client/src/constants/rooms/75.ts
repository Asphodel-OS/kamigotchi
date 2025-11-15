import { bgPlaytestDay } from 'assets/images/rooms/75_flood-mural';
import { k11 } from 'assets/sound/ost';
import { Room } from './types';

export const room75: Room = {
  index: 75,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'k11',
    path: k11,
  },
  objects: [],
};
