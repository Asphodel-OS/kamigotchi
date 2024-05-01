import { bgPlaytestDay } from 'assets/images/rooms/10_forest-insect';
import { glitter } from 'assets/sound/ost';
import { Room } from 'constants/rooms';
import { triggerNodeModal } from 'layers/react/triggers/triggerNodeModal';

export const room10: Room = {
  roomIndex: 10,
  background: {
    key: 'bg_room010',
    path: bgPlaytestDay,
  },
  music: {
    key: 'glitter',
    path: glitter,
  },
  objects: [
    {
      name: 'beetle 5',
      coordinates: { x1: 13, y1: 95, x2: 31, y2: 110 },
      dialogue: 101,
    },
    {
      name: 'centipede and grub',
      coordinates: { x1: 86, y1: 107, x2: 125, y2: 125 },
      dialogue: 102,
    },
    {
      name: 'forest trunk',
      coordinates: { x1: 5, y1: 45, x2: 20, y2: 70 },
      dialogue: 103,
    },
    {
      name: 'termite mound',
      coordinates: { x1: 30, y1: 25, x2: 108, y2: 110 },
      onClick: () => triggerNodeModal(3),
    },
  ],
};
