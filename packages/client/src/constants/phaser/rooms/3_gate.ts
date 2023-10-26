import {
  backgroundDefault,
  objectToriiGate,
} from 'assets/images/rooms/3_gate';
import { opening } from 'assets/sound/ost';
import { Room } from 'constants/phaser/rooms';
import { triggerNodeModal } from 'layers/phaser/utils/triggerNodeModal';


export const room3: Room = {
  location: 3,
  background: {
    key: 'bg_room003',
    path: backgroundDefault,
  },
  music: {
    key: 'opening',
    path: opening,
  },
  objects: [
    {
      key: 'toriigate',
      path: objectToriiGate,
      offset: { x: 21, y: -8 },
      onClick: () => triggerNodeModal(1),
    },
  ],
};