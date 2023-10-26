import {
  backgroundDefault,
  objectCabinet,
  objectChair,
} from 'assets/images/rooms/7_office-lobby';
import { ost3 } from 'assets/sound/ost';
import { Room } from 'constants/phaser/rooms';


export const room7: Room = {
  location: 7,
  background: {
    key: 'bg_room007',
    path: backgroundDefault,
  },
  music: {
    key: 'ost3',
    path: ost3,
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