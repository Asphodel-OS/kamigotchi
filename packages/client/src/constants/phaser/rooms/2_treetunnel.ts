import {
  backgroundShop,
  objectGate,
  objectHollowStump,
  objectShopDoor,
} from 'assets/images/rooms/2_tree-tunnel';
import { arrival } from 'assets/sound/ost';
import { Room } from 'constants/phaser/rooms';


export const room2: Room = {
  location: 2,
  background: {
    key: 'bg_room002',
    path: backgroundShop,
  },
  music: {
    key: 'arrival',
    path: arrival,
  },
  objects: [
    {
      key: 'hollowstump',
      path: objectHollowStump,
      offset: { x: -48.5, y: 29.5 },
      dialogue: 21,
    },
    {
      key: 'gate',
      path: objectGate,
      offset: { x: -39.5, y: -33.5 },
      dialogue: 22,
    },
    {
      key: 'shopdoor',
      path: objectShopDoor,
      offset: { x: 5, y: -7 },
      dialogue: 23,
    },
  ],
};