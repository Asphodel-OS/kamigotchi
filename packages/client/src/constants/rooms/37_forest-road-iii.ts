import { bgPlaytest } from 'assets/images/rooms/37_forest-road-iii';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room37: Room = {
  roomIndex: 37,
  background: {
    key: 'bg_room37',
    path: bgPlaytest,
  },
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
