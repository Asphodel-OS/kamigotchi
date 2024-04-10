import { bgPlaytest } from 'assets/images/rooms/46_parking-lot';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room46: Room = {
  roomIndex: 46,
  background: {
    key: 'bg_room46',
    path: bgPlaytest,
  },
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
