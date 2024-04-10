import { bgPlaytest } from 'assets/images/rooms/38_hallway-ii';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room38: Room = {
  roomIndex: 38,
  background: {
    key: 'bg_room38',
    path: bgPlaytest,
  },
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
