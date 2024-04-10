import { bgPlaytest } from 'assets/images/rooms/47_scrap-paths';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room47: Room = {
  roomIndex: 47,
  background: {
    key: 'bg_room47',
    path: bgPlaytest,
  },
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
