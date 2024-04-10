import { bgPlaytest } from 'assets/images/rooms/23_submerged-giant';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room23: Room = {
  roomIndex: 23,
  background: {
    key: 'bg_room23',
    path: bgPlaytest,
  },
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
