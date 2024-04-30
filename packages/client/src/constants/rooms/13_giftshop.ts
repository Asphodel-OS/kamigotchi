import { bgPlaytest } from 'assets/images/rooms/13_giftshop';
import { mystique } from 'assets/sound/ost';
import { Room } from 'constants/rooms';
import { triggerShopModal } from 'layers/phaser/utils/triggers/triggerShopModal';

export const room13: Room = {
  roomIndex: 13,
  background: {
    key: 'bg_room013',
    path: bgPlaytest,
  },
  music: {
    key: 'mystique',
    path: mystique,
  },
  objects: [
    {
      // clock
      coordinates: { x1: 0, y1: 0, x2: 20, y2: 20 },
      dialogue: 131,
    },
    {
      // mina
      coordinates: { x1: 0, y1: 0, x2: 20, y2: 20 },
      dialogue: 132,
    },
    {
      // cashregister
      coordinates: { x1: 0, y1: 0, x2: 20, y2: 20 },
      onClick: () => triggerShopModal(1),
    },
  ],
};
