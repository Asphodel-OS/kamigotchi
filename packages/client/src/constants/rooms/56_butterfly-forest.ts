import { bgChristmasNight, bgPlaytestDay } from 'assets/images/rooms/56_butterfly-forest';
import { k8 } from 'assets/sound/ost';

import { Room } from './types';

export const room56: Room = {
  index: 56,
  backgrounds: [bgPlaytestDay, bgChristmasNight, bgChristmasNight],
  music: {
    key: 'k8',
    path: k8,
  },
  objects: [],
};
