import { bgPlaytest } from 'assets/images/rooms/21_hallway-i';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room21: Room = {
  roomIndex: 21,
  background: {
    key: 'bg_room21',
    path: bgPlaytest,
  },
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
