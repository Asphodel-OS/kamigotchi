import { backgroundNight, objectVendingMachine } from 'assets/images/rooms/4_junkyard';
import { mystique } from 'assets/sound/ost';
import { Room } from 'constants/rooms';
import { triggerPetMintModal } from 'layers/phaser/utils/triggers/triggerPetMintModal';

export const room4: Room = {
  roomIndex: 4,
  background: {
    key: 'bg_room004',
    path: backgroundNight,
  },
  music: {
    key: 'mystique',
    path: mystique,
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
