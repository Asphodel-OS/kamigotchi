import { bgPlaytest } from 'assets/images/rooms/23_submerged-giant';
import { cave } from 'assets/sound/ost';
import { Room } from './types';

export const room23: Room = {
  index: 23,
  backgrounds: [bgPlaytest],
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
