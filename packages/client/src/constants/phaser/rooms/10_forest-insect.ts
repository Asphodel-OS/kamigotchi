import {
  backgroundDefault,
  objectBeetle4,
  objectCentipede,
  objectHollowTrunk,
  objectTermiteMound,
} from 'assets/images/rooms/10_forest-insect';
import { ost2 } from 'assets/sound/ost';

import { triggerDialogueModal } from 'layers/phaser/utils/triggerDialogueModal';
import { triggerNodeModal } from 'layers/phaser/utils/triggerNodeModal';
import { Room } from 'constants/phaser/rooms';

export const room10: Room = {
  location: 10,
  background: {
    key: 'bg_room010',
    path: backgroundDefault,
  },
  music: {
    key: 'ost2',
    path: ost2,
  },
  objects: [
    {
      key: 'beetle4',
      path: objectBeetle4,
      offset: { x: -42.55, y: 38.6 },
      onClick: () => triggerDialogueModal(['Beetle four. The black sheep.']),
    },
    {
      key: 'centipedeandgrub',
      path: objectCentipede,
      offset: { x: 41.6, y: 52.5 },
      onClick: () =>
        triggerDialogueModal([
          'A centipede and a grub. The relationship between them is ambiguous and of great interest to the beetles nearby.',
        ]),
    },
    {
      key: 'foresttrunk',
      path: objectHollowTrunk,
      offset: { x: -53, y: -7 },
      onClick: () =>
        triggerDialogueModal([
          "A hollow tree-trunk. This should obviously have a secret item or something in it, right? To be honest, we haven't implemented those yet.",
        ]),
    },
    {
      key: 'termitemound',
      path: objectTermiteMound,
      offset: { x: 5.4, y: 1.5 },
      onClick: () => triggerNodeModal(3),
    },
  ],
};