import { backgroundDefault, path15 } from 'assets/images/rooms/16_techno-temple';
import { ost3 } from 'assets/sound/ost';

import { triggerRoomMovementModal } from 'layers/phaser/utils/triggerRoomMovementModal';
import { Room } from 'constants/phaser/rooms';

export const room16: Room = {
  location: 16,
  background: {
    key: 'bg_room16',
    path: backgroundDefault,
  },
  music: {
    key: 'ost3',
    path: ost3,
  },
  objects: [
    {
      key: 'technofloor',
      path: path15,
      offset: { x: 0, y: 59.1 },
      onClick: () => triggerRoomMovementModal(15),
    },
  ],
};