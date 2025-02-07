import { bgPlaytest } from 'assets/images/rooms/39_hallway-iii';
import { cave } from 'assets/sound/ost';
import { Room } from './types';

export const room39: Room = {
  index: 39,
  backgrounds: [bgPlaytest],
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
