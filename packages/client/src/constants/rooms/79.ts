import { bgPlaytestDay } from 'assets/images/rooms/79_abandoned-campsite';
import { k11 } from 'assets/sound/ost';
import { Room } from './types';

export const room79: Room = {
  index: 79,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'k11',
    path: k11,
  },
  objects: [],
};
