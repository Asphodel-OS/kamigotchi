import {
  backgroundDefault,
  path15,
  path19,
  path20,
} from 'assets/images/rooms/18_cave-crossroads';
import { ost3 } from 'assets/sound/ost';

import { triggerRoomMovementModal } from 'layers/phaser/utils/triggerRoomMovementModal';
import { Room } from 'constants/phaser/rooms';

export const room18: Room = {
  location: 18,
  background: {
    key: 'bg_room18',
    path: backgroundDefault,
  },
  music: {
    key: 'ost3',
    path: ost3,
  },
  objects: [
    {
      key: 'cavefloor',
      path: path15,
      offset: { x: 25, y: 53.1 },
      onClick: () => triggerRoomMovementModal(15),
    },
    {
      key: 'cavecrossleft',
      path: path19,
      offset: { x: -46, y: -5.8 },
      onClick: () => triggerRoomMovementModal(19),
    },
    {
      key: 'cavecrossright',
      path: path20,
      offset: { x: 18.5, y: -19.7 },
      onClick: () => triggerRoomMovementModal(15),
    },
  ],
};