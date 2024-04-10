import { bgPlaytest } from 'assets/images/rooms/41_hallway-v';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room41: Room = {
  roomIndex: 41,
  background: {
    key: 'bg_room41',
    path: bgPlaytest,
  },
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
