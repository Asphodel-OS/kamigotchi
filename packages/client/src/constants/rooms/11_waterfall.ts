import { bgPlaytestDay } from 'assets/images/rooms/11_waterfall';
import { glitter } from 'assets/sound/ost';
import { Room } from 'constants/rooms';
import { triggerPetNamingModal } from 'layers/phaser/utils/triggers/triggerPetNamingModal';

export const room11: Room = {
  roomIndex: 11,
  background: {
    key: 'bg_room011',
    path: bgPlaytestDay,
  },
  music: {
    key: 'glitter',
    path: glitter,
  },
  objects: [
    {
      // emaboard
      coordinates: { x1: 92, y1: 76, x2: 127, y2: 115 },
      onClick: triggerPetNamingModal,
    },
    {
      // stonelantern
      coordinates: { x1: 3, y1: 88, x2: 24, y2: 110 },
      dialogue: 111,
    },
    {
      // smallshrine
      coordinates: { x1: 39, y1: 62, x2: 77, y2: 108 },
      dialogue: 112,
    },
    {
      // waterfall
      coordinates: { x1: 59, y1: 30, x2: 117, y2: 60 },
      dialogue: 113,
    },
  ],
};
