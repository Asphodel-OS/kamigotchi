import { bgPlaytest } from 'assets/images/rooms/25_lost-skeleton';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room25: Room = {
  roomIndex: 25,
  background: {
    key: 'bg_room25',
    path: bgPlaytest,
  },
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
