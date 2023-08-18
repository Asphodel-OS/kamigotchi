import { backgroundDefault } from 'assets/images/rooms/17_misty-park';
import { ost3 } from 'assets/sound/ost';

import { Room } from 'constants/phaser/rooms';

export const room17: Room = {
  location: 17,
  background: {
    key: 'bg_room17',
    path: backgroundDefault,
  },
  music: {
    key: 'ost3',
    path: ost3,
  },
};