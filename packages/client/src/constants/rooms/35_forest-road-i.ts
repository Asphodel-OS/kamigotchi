import { bgPlaytest } from 'assets/images/rooms/35_forest-road-i';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room35: Room = {
  roomIndex: 35,
  background: {
    key: 'bg_room35',
    path: bgPlaytest,
  },
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
