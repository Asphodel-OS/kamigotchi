import {
  backgroundDefault,
  path11,
  path16,
  path18
} from 'assets/images/rooms/15_temple-cave';
import { ost3 } from 'assets/sound/ost';

import { triggerRoomMovementModal } from 'layers/phaser/utils/triggerRoomMovementModal';
import { Room } from 'constants/phaser/rooms';

export const room15: Room = {
  location: 15,
  background: {
    key: 'bg_room15',
    path: backgroundDefault,
  },
  music: {
    key: 'ost3',
    path: ost3,
  },
  objects: [
    {
      key: 'templegrass',
      path: path11,
      offset: { x: -8.5, y: 57 },
      onClick: () => triggerRoomMovementModal(11),
    },
    {
      key: 'templedoor',
      path: path16,
      offset: { x: 41.3, y: -8.7 },
      onClick: () => triggerRoomMovementModal(16),
    },
    {
      key: 'templecave',
      path: path18,
      offset: { x: -18, y: -15 },
      onClick: () => triggerRoomMovementModal(18),
    },
  ],
};