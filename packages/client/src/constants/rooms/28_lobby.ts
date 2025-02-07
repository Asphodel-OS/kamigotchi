import { bgPlaytest } from 'assets/images/rooms/28_lobby';
import { cave } from 'assets/sound/ost';
import { Room } from './types';

export const room28: Room = {
  index: 28,
  backgrounds: [bgPlaytest],
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
