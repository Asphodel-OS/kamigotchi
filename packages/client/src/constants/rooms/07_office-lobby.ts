import { bgPlaytest, objectCabinet, objectChair } from 'assets/images/rooms/7_office-lobby';
import { abandoned } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room07: Room = {
  roomIndex: 7,
  background: {
    key: 'bg_room007',
    path: bgPlaytest,
  },
  music: {
    key: 'abandoned',
    path: abandoned,
  },
  objects: [
    {
      key: 'chair',
      path: objectChair,
      offset: { x: -40, y: 31.9 },
      dialogue: 71,
    },
    {
      key: 'cabinet',
      path: objectCabinet,
      offset: { x: 26, y: 17.4 },
      dialogue: 72,
    },
  ],
};
