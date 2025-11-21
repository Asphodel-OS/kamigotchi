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
      coordinates: { x1: 0, y1: 0, x2: 0, y2: 0 },
      dialogue: 731,
    },
    {
      name: 'broken tube',
      coordinates: { x1: 0, y1: 0, x2: 0, y2: 0 },
      dialogue: 732,
    },
  ],
};
