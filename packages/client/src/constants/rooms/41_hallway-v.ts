import { bgPlaytest } from 'assets/images/rooms/41_hallway-v';
import { cave } from 'assets/sound/ost';
import { Room } from './types';

export const room41: Room = {
  index: 41,
  backgrounds: [bgPlaytest],
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
