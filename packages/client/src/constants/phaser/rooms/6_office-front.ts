import {
  backgroundDefault,
  objectBuildingLogo,
  objectFoxStatues,
} from 'assets/images/rooms/6_office-front';
import { ost1 } from 'assets/sound/ost';

import { triggerDialogueModal } from 'layers/phaser/utils/triggerDialogueModal';
import { Room } from 'constants/phaser/rooms';

export const room6: Room = {
  location: 6,
  background: {
    key: 'bg_room006',
    path: backgroundDefault,
  },
  music: {
    key: 'ost1',
    path: ost1,
  },
  objects: [
    {
      key: 'abuildinglogo',
      path: objectBuildingLogo,
      offset: { x: 0, y: -45 },
      onClick: () =>
        triggerDialogueModal([
          "There's a logo plaque here. It's perfectly maintained, despite the decrepit state of the rest of of the entrance.",
        ]),
    },
    {
      key: 'foxstatues',
      path: objectFoxStatues,
      offset: { x: 0, y: 28 },
      onClick: () =>
        triggerDialogueModal([
          'The fox statues are flanking the entrance perfectly. As you step past them, the texture of the air changes slightly.',
        ]),
    },
  ],
};