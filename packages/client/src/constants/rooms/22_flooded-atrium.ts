import { bgPlaytest } from 'assets/images/rooms/22_flooded-atrium';
import { cave } from 'assets/sound/ost';
import { Room } from './types';

export const room22: Room = {
  index: 22,
  backgrounds: [bgPlaytest],
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
