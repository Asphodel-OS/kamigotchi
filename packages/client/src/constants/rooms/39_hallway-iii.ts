import { bgPlaytest } from 'assets/images/rooms/39_hallway-iii';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room39: Room = {
  roomIndex: 39,
  background: {
    key: 'bg_room39',
    path: bgPlaytest,
  },
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
