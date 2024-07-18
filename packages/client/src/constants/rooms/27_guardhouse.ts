import { bgPlaytest } from 'assets/images/rooms/27_guardhouse';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room27: Room = {
  index: 27,
  backgrounds: [bgPlaytest],
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
