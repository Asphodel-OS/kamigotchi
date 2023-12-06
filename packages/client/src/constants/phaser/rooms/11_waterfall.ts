import {
  backgroundDefault,
  backgroundOld,
  objectEmaBoard,
  objectSmallShrine,
  objectStoneLantern,
  objectWaterfall,
} from 'assets/images/rooms/11_waterfall';
import { glitter } from 'assets/sound/ost';
import { Room } from 'constants/phaser/rooms';
import { triggerPetNamingModal } from 'layers/phaser/utils/triggerPetNamingModal';


export const room11: Room = {
  location: 11,
  background: {
    key: 'bg_room011',
    path: backgroundDefault,
  },
  music: {
    key: 'glitter',
    path: glitter,
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
      dialogue: 111,
    },
    {
      key: 'smallshrine',
      path: objectSmallShrine,
      offset: { x: -5.48, y: 16.1 },
      dialogue: 112,
    },
    {
      key: 'waterfall',
      path: objectWaterfall,
      offset: { x: 22.6, y: -33.5 },
      dialogue: 113,
    },
  ],
};