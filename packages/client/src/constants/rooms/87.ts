import { bgPlaytestDay } from 'assets/images/rooms/87_sacrarium';
import { sacrarium } from 'assets/sound/ost';
import { Room } from './types';

export const room87: Room = {
  index: 87,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'sacrarium',
    path: sacrarium,
  },
  objects: [],
};
