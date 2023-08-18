import {
  backgroundDefault,
  objectCompanyBuilding,
  objectTrashBag,
  objectWarningSign,
} from 'assets/images/rooms/5_restricted';
import { ost1 } from 'assets/sound/ost';

import { triggerDialogueModal } from 'layers/phaser/utils/triggerDialogueModal';
import { Room } from 'constants/phaser/rooms';

export const room5: Room = {
  location: 5,
  background: {
    key: 'bg_room005',
    path: backgroundDefault,
  },
  music: {
    key: 'ost1',
    path: ost1,
  },
  objects: [
    {
      key: 'trashbag',
      path: objectTrashBag,
      offset: { x: -55.5, y: 50 },
      onClick: () => triggerDialogueModal(['A bag of trash. But rooting through it...']),
    },
    {
      key: 'acompanybuilding',
      path: objectCompanyBuilding,
      offset: { x: -30.1, y: -35 },
      onClick: () => triggerDialogueModal(['An office building?']),
    },
    {
      key: 'warningsign',
      path: objectWarningSign,
      offset: { x: 10.5, y: 39.6 },
      onClick: () =>
        triggerDialogueModal([
          'The "writing" on this sign is illegible nonsense. It looks like a warning, however.',
        ]),
    },
  ],
};