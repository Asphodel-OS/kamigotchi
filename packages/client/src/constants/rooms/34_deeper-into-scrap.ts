import { bgPlaytest } from 'assets/images/rooms/34_deeper-into-scrap';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room34: Room = {
  roomIndex: 34,
  background: {
    key: 'bg_room34',
    path: bgPlaytest,
  },
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
