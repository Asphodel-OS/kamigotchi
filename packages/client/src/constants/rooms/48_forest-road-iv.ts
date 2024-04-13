import { bgPlaytestDay } from 'assets/images/rooms/48_forest-road-iv';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room48: Room = {
  roomIndex: 48,
  background: {
    key: 'bg_room48',
    path: bgPlaytestDay,
  },
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
