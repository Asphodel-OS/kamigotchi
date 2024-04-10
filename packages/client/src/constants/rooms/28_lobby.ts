import { bgPlaytest } from 'assets/images/rooms/28_lobby';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room28: Room = {
  roomIndex: 28,
  background: {
    key: 'bg_room28',
    path: bgPlaytest,
  },
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
