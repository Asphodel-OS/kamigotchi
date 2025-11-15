import { bgPlaytestDay } from 'assets/images/rooms/87_sacrarium';
import { k11 } from 'assets/sound/ost';
import { Room } from './types';

export const room87: Room = {
  index: 87,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'k11',
    path: k11,
  },
  objects: [],
};
