import { bgPlaytest } from 'assets/images/rooms/22_flooded-atrium';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room22: Room = {
  roomIndex: 22,
  background: {
    key: 'bg_room22',
    path: bgPlaytest,
  },
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
