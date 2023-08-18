import {
  backgroundDefault,
  backgroundOld,
  objectEmaBoard,
  objectSmallShrine,
  objectStoneLantern,
  objectWaterfall,
} from 'assets/images/rooms/11_waterfall';
import { ost2 } from 'assets/sound/ost';

import { triggerDialogueModal } from 'layers/phaser/utils/triggerDialogueModal';
import { triggerPetNamingModal } from 'layers/phaser/utils/triggerPetNamingModal';
import { triggerRoomMovementModal } from 'layers/phaser/utils/triggerRoomMovementModal';
import { Room } from 'constants/phaser/rooms';

export const room11: Room = {
  location: 11,
  background: {
    key: 'bg_room011',
    path: backgroundDefault,
  },
  music: {
    key: 'ost2',
    path: ost2,
  },
  objects: [
    {
      key: 'emaboard',
      path: objectEmaBoard,
      offset: { x: 45.5, y: 31 },
      onClick: triggerPetNamingModal,
    },
    {
      key: 'stonelantern',
      path: objectStoneLantern,
      offset: { x: -50.4, y: 34.6 },
      onClick: () => triggerDialogueModal(['A stone lantern. Very roughly carved.']),
    },
    {
      key: 'waterfall',
      path: objectWaterfall,
      offset: { x: 22.6, y: -33.5 },
      onClick: () => triggerRoomMovementModal(15),
    },
    {
      key: 'smallshrine',
      path: objectSmallShrine,
      offset: { x: -5.48, y: 16.1 },
      onClick: () =>
        triggerDialogueModal([
          'A small shrine. This almost has the energy of a Node, but something is off...',
        ]),
    },
  ],
};