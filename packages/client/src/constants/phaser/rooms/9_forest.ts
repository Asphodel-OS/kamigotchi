import {
  backgroundDefault,
  objectBeetle1,
  objectBeetle2,
  objectBeetle3,
  objectBeetle4,
  objectSmallMushrooms,
} from 'assets/images/rooms/9_forest';
import { ost2 } from 'assets/sound/ost';

import { triggerDialogueModal } from 'layers/phaser/utils/triggerDialogueModal';
import { Room } from 'constants/phaser/rooms';

export const room9: Room = {
  location: 9,
  background: {
    key: 'bg_room009',
    path: backgroundDefault,
  },
  music: {
    key: 'ost2',
    path: ost2,
  },
  objects: [
    {
      key: 'beetle1',
      path: objectBeetle1,
      offset: { x: 53.5, y: -53.35 },
      onClick: () =>
        triggerDialogueModal([
          'The first of a number of local beetles. Quiet and contemplative.',
        ]),
    },
    {
      key: 'beetle2',
      path: objectBeetle2,
      offset: { x: 11.5, y: -7 },
      onClick: () =>
        triggerDialogueModal([
          'The second of a number of local beetles. While they might be insignificant to you, their numbers are very important to them.',
        ]),
    },
    {
      key: 'beetle3',
      path: objectBeetle3,
      offset: { x: -59.5, y: -15.5 },
      onClick: () =>
        triggerDialogueModal(['Beetle number three. More private than the others.'
        ]),
    },
    {
      key: 'beetle4',
      path: objectBeetle4,
      offset: { x: 43.5, y: 2 },
      onClick: () =>
        triggerDialogueModal(['Beetle number four. A bit of a loner.'
        ]),
    },
    {
      key: 'smallmushrooms',
      path: objectSmallMushrooms,
      offset: { x: -52, y: 58 },
      onClick: () =>
        triggerDialogueModal([
          "You haven't seen Mushrooms like this anywhere else in this forest.",
        ]),
    },
  ],
};