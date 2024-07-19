import { bgPlaytest } from 'assets/images/rooms/40_hallway-iv';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room40: Room = {
  index: 40,
  backgrounds: [bgPlaytest],
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
