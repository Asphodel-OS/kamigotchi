import { bgPlaytest } from 'assets/images/rooms/44_hallway-viii';
import { cave } from 'assets/sound/ost';
import { Room } from './types';

export const room44: Room = {
  index: 44,
  backgrounds: [bgPlaytest],
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
