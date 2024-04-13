import { bgPlaytestDay } from 'assets/images/rooms/32_road-to-labs';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room32: Room = {
  roomIndex: 32,
  background: {
    key: 'bg_room32',
    path: bgPlaytestDay,
  },
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
