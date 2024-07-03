import { bgPlaytestDay } from 'assets/images/rooms/3_gate';
import { arrival } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room03: Room = {
  roomIndex: 3,
  background: {
    key: 'bg_room003',
    path: bgPlaytestDay,
  },
  music: {
    key: 'arrival',
    path: arrival,
  },
  objects: [
    // {
    //   name: 'torii gate',
    //   coordinates: { x1: 48, y1: 29, x2: 123, y2: 85 },
    // },
  ],
};
