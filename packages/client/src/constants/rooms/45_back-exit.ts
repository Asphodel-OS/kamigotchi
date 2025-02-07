import { bgPlaytest } from 'assets/images/rooms/45_back-exit';
import { cave } from 'assets/sound/ost';
import { Room } from './types';

export const room45: Room = {
  index: 45,
  backgrounds: [bgPlaytest],
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
