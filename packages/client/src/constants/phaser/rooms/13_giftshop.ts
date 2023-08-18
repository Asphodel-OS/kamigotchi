import {
  backgroundMina,
  backgroundEmpty,
  objectMina,
  objectCashRegister,
} from 'assets/images/rooms/13_giftshop';
import { forest as forestOST } from 'assets/sound/ost';

import { triggerDialogueModal } from 'layers/phaser/utils/triggerDialogueModal';
import { triggerShopModal } from 'layers/phaser/utils/triggerShopModal';
import { Room } from 'constants/phaser/rooms';

export const room13: Room = {
  location: 13,
  background: {
    key: 'bg_room013',
    path: backgroundMina,
  },
  music: {
    key: 'forest',
    path: forestOST,
  },
  objects: [
    {
      key: 'cashregister',
      path: objectCashRegister,
      offset: { x: -50.5, y: -8.02 },
      onClick: triggerShopModal,
    },
    {
      key: 'mina',
      path: objectMina,
      offset: { x: -15, y: -24.6 },
      onClick: () =>
        triggerDialogueModal([
          "Mina doesn't want to talk to you. Perhaps her dialogue will be implemented soon.",
        ]),
    },
  ],
};