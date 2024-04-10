import { bgPlaytest } from 'assets/images/rooms/31_scrapyard-exit';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room31: Room = {
  roomIndex: 31,
  background: {
    key: 'bg_room31',
    path: bgPlaytest,
  },
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
