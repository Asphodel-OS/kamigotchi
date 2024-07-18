import { bgPlaytest } from 'assets/images/rooms/21_hallway-i';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room21: Room = {
  index: 21,
  backgrounds: [bgPlaytest],
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
