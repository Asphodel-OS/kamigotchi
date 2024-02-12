import {
  backgroundMina,
  objectCashRegister,
  objectClock,
  objectMinaRed,
} from 'assets/images/rooms/13_giftshop';
import { mystique } from 'assets/sound/ost';
import { Room } from 'constants/rooms';
import { triggerShopModal } from 'layers/phaser/utils/triggers/triggerShopModal';

export const room13: Room = {
  roomIndex: 13,
  background: {
    key: 'bg_room013',
    path: backgroundMina,
  },
  music: {
    key: 'mystique',
    path: mystique,
  },
  objects: [
    {
      key: 'clock',
      path: objectClock,
      offset: { x: 31.5, y: -33.5 },
      dialogue: 131,
    },
    {
      key: 'mina',
      path: objectMinaRed,
      offset: { x: -16.5, y: -25 },
      dialogue: 132,
    },
    {
      key: 'cashregister',
      path: objectCashRegister,
      offset: { x: -50.5, y: -8.02 },
      onClick: () => triggerShopModal(1),
    },
  ],
};
