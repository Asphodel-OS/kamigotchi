import { triggerPetMintModal } from 'app/triggers/triggerPetMintModal';
import { bgGifDay, bgGifEvening, bgGifNight } from 'assets/images/rooms/4_junkyard';
import { mystique } from 'assets/sound/ost';
import { Room } from './types';

export const room04: Room = {
  index: 4,
  backgrounds: [bgGifDay, bgGifEvening, bgGifNight],
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
