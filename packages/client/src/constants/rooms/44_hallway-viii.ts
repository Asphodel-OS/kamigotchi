import { bgPlaytest } from 'assets/images/rooms/44_hallway-viii';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room44: Room = {
  roomIndex: 44,
  background: {
    key: 'bg_room44',
    path: bgPlaytest,
  },
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
