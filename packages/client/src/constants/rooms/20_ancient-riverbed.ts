import { bgPlaytest } from 'assets/images/rooms/20_ancient-riverbed';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room20: Room = {
  roomIndex: 20,
  background: {
    key: 'bg_room20',
    path: bgPlaytest,
  },
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
