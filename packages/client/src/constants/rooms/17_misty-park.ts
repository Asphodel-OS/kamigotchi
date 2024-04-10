import { bgPlaytestDay } from 'assets/images/rooms/17_misty-park';
import { cave } from 'assets/sound/ost';

import { Room } from 'constants/rooms';

export const room17: Room = {
  roomIndex: 17,
  background: {
    key: 'bg_room17',
    path: bgPlaytestDay,
  },
  music: {
    key: 'cave',
    path: cave,
  },
};
