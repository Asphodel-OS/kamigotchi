import { bgPlaytestDay } from 'assets/images/rooms/49_clearing';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room49: Room = {
  roomIndex: 49,
  background: {
    key: 'bg_room49',
    path: bgPlaytestDay,
  },
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
