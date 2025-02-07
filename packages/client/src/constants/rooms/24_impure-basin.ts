import { bgPlaytest } from 'assets/images/rooms/24_impure-basin';
import { cave } from 'assets/sound/ost';
import { Room } from './types';

export const room24: Room = {
  index: 24,
  backgrounds: [bgPlaytest],
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
