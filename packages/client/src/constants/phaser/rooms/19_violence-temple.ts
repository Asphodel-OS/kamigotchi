import {
  backgroundDefault,
  path18,
  objectDharmaWheel,
} from 'assets/images/rooms/19_violence-temple';
import { ost3 } from 'assets/sound/ost';

import { triggerLeaderboardModal } from 'layers/phaser/utils/triggerLeaderboardModal';
import { triggerRoomMovementModal } from 'layers/phaser/utils/triggerRoomMovementModal';
import { Room } from 'constants/phaser/rooms';

export const room19: Room = {
  location: 19,
  background: {
    key: 'bg_room19',
    path: backgroundDefault,
  },
  music: {
    key: 'ost3',
    path: ost3,
  },
  objects: [
    {
      key: 'violencefloor',
      path: path18,
      offset: { x: -4, y: 59.1 },
      onClick: () => triggerRoomMovementModal(18),
    },
    {
      key: 'dharmawheel',
      path: objectDharmaWheel,
      offset: { x: 0, y: 0 },
      onClick: () => triggerLeaderboardModal(),
    },
  ],
};