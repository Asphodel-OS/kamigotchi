import { bgPlaytest } from 'assets/images/rooms/36_forest-road-ii';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room36: Room = {
  roomIndex: 36,
  background: {
    key: 'bg_room36',
    path: bgPlaytest,
  },
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
