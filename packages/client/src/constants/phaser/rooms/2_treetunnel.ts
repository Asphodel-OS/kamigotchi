import {
  backgroundEmpty,
  backgroundShop,
  objectClearing,
  objectGate,
  objectHollowStump,
  objectShopDoor,
} from 'assets/images/rooms/2_tree-tunnel';
import { opening } from 'assets/sound/ost';

import { triggerDialogueModal } from 'layers/phaser/utils/triggerDialogueModal';
import { Room } from 'constants/phaser/rooms';


export const room2: Room = {
  location: 2,
  background: {
    key: 'bg_room002',
    path: backgroundShop,
  },
  music: {
    key: 'opening',
    path: opening,
  },
  objects: [
    {
      key: 'hollowstump',
      path: objectHollowStump,
      offset: { x: -48.5, y: 29.5 },
      onClick: () =>
        triggerDialogueModal([
          "It's a hollow tree stump. There doesn't appear to be anything inside.",
        ]),
    },
    {
      key: 'gate',
      path: objectGate,
      offset: { x: -39.5, y: -33.5 },
      onClick: () => triggerDialogueModal(["There's some sort of gate in the distance."]),
    },
    {
      key: 'shopdoor',
      path: objectShopDoor,
      offset: { x: 5, y: -7 },
      onClick: () =>
        triggerDialogueModal(["There's what appears to be a door hanging in mid-air!"]),
    },
  ],
};