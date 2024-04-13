import { bgPlaytestDay } from 'assets/images/rooms/26_trash-strewn-graves';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room26: Room = {
  roomIndex: 26,
  background: {
    key: 'bg_room26',
    path: bgPlaytestDay,
  },
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [],
};
