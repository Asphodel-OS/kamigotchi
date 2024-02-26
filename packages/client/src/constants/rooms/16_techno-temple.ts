import { backgroundDefault, path15 } from 'assets/images/rooms/16_techno-temple';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room16: Room = {
  roomIndex: 16,
  background: {
    key: 'bg_room16',
    path: backgroundDefault,
  },
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [
    {
      key: 'technofloor',
      path: path15,
      offset: { x: 0, y: 59.1 },
      dialogue: 161,
    },
  ],
};
