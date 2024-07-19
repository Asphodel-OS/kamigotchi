import { bgPlaytest } from 'assets/images/rooms/43_hallway-vii';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room43: Room = {
  index: 43,
  backgrounds: [bgPlaytest],
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
