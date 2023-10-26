import {
  backgroundCloudy,
  backgroundNight,
  backgroundSunset,
  objectVendingMachine,
} from 'assets/images/rooms/4_junkyard';
import { forest } from 'assets/sound/ost';
import { Room } from 'constants/phaser/rooms';
import { triggerPetMintModal } from 'layers/phaser/utils/triggerPetMintModal';


export const room4: Room = {
  location: 4,
  background: {
    key: 'bg_room004',
    path: backgroundNight,
  },
  music: {
    key: 'forest',
    path: forest,
  },
  objects: [
    {
      key: 'vendingmachine',
      path: objectVendingMachine,
      offset: { x: -33.5, y: 9.5 },
      onClick: triggerPetMintModal,
    },
  ],
};