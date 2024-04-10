import { bgPlaytest } from 'assets/images/rooms/33_forest-entrance';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room33: Room = {
  roomIndex: 33,
  background: {
    key: 'bg_room33',
    path: bgPlaytest,
  },
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
