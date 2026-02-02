import { bgPlaytestDay } from 'assets/images/rooms/73_broken-tube';
import { brokenTube } from 'assets/sound/ost';
import { Room } from './types';

export const room73: Room = {
  index: 73,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'brokenTube',
    path: brokenTube,
  },
  objects: [
    {
      name: 'large panel',
      coordinates: { x1: 100, y1: 90, x2: 127, y2: 122 },
      dialogue: 731,
    },
    {
      name: 'broken tube',
      coordinates: { x1: 20, y1: 25, x2: 55, y2: 110 },
      dialogue: 732,
    },
  ],
};
