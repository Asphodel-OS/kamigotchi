import { bgChristmas } from 'assets/images/rooms/70_still-stream';
import { stillStream } from 'assets/sound/ost';
import { Room } from './types';

export const room70: Room = {
  index: 70,
  backgrounds: [bgChristmas],
  music: {
    key: 'stillStream',
    path: stillStream,
  },
  objects: [
    {
      name: 'central stalagmite',
      coordinates: { x1: 0, y1: 0, x2: 0, y2: 0 },
      dialogue: 701,
    },
  ],
};
