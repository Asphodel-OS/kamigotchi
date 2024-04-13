import { bgPlaytestDay } from 'assets/images/rooms/30_scrapyard-entrance';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room30: Room = {
  roomIndex: 30,
  background: {
    key: 'bg_room30',
    path: bgPlaytestDay,
  },
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
