import { bgPlaytestDay } from 'assets/images/rooms/70_still-stream';
import { stillStream } from 'assets/sound/ost';
import { Room } from './types';

export const room70: Room = {
  index: 70,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'stillStream',
    path: stillStream,
  },
  objects: [
    {
      name: 'central stalagmite',
      coordinates: { x1: 45, y1: 70, x2: 85, y2: 110 },
      dialogue: 701,
    },
  ],
};
