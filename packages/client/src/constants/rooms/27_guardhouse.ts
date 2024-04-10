import { bgPlaytest } from 'assets/images/rooms/27_guardhouse';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room27: Room = {
  roomIndex: 27,
  background: {
    key: 'bg_room27',
    path: bgPlaytest,
  },
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
