import { bgPlaytest } from 'assets/images/rooms/27_guardhouse';
import { cave } from 'assets/sound/ost';
import { Room } from './types';

export const room27: Room = {
  index: 27,
  backgrounds: [bgPlaytest],
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
