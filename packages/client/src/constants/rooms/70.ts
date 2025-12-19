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
  objects: [],
};
