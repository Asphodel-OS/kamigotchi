import { bgPlaytest } from 'assets/images/rooms/38_hallway-ii';
import { cave } from 'assets/sound/ost';
import { Room } from './types';

export const room38: Room = {
  index: 38,
  backgrounds: [bgPlaytest],
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
