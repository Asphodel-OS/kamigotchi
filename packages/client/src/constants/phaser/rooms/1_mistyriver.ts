import {
  backgroundEmpty,
  backgroundSign,
  objectMooringPost,
} from 'assets/images/rooms/1_misty-river';
import { opening } from 'assets/sound/ost';

import { triggerDialogueModal } from 'layers/phaser/utils/triggerDialogueModal';
import { Room } from 'constants/phaser/rooms';

export const room1: Room = {
  location: 1,
  background: {
    key: 'bg_room001',
    path: backgroundSign,
  },
  music: {
    key: 'opening',
    path: opening,
  },
  objects: [
    {
      key: 'mooringpost',
      path: objectMooringPost,
      offset: { x: -19, y: 38 },
      onClick: () =>
        triggerDialogueModal([
          "This looks like a mooring post. There's enough rope attached to secure a boat. Somehow, you know the spot is taken.",
        ]),
    },
  ],
};