import { bgPlaytest } from 'assets/images/rooms/29_road-out-of-woods';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room29: Room = {
  roomIndex: 29,
  background: {
    key: 'bg_room29',
    path: bgPlaytest,
  },
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
