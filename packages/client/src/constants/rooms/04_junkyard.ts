import { bgPlaytestNight } from 'assets/images/rooms/4_junkyard';
import { mystique } from 'assets/sound/ost';
import { Room } from 'constants/rooms';
import { triggerPetMintModal } from 'layers/react/triggers/triggerPetMintModal';

export const room04: Room = {
  roomIndex: 4,
  background: {
    key: 'bg_room004',
    path: bgPlaytestNight,
  },
  music: {
    key: 'mystique',
    path: mystique,
  },
  objects: [
    {
      name: 'vending machine',
      coordinates: { x1: 15, y1: 56, x2: 46, y2: 90 },
      onClick: triggerPetMintModal,
    },
  ],
};
