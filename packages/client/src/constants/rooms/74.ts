import { bgPlaytestDay } from 'assets/images/rooms/74_engraved-door';
import { engravedDoor } from 'assets/sound/ost';
import { Room } from './types';

export const room74: Room = {
  index: 74,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'engravedDoor',
    path: engravedDoor,
  },
  objects: [],
};
