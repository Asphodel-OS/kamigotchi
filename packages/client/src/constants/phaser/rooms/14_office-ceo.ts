import {
  backgroundDefault,
  backgroundOld,
  objectImac,
  objectOccultCircle,
  objectPaperwork,
  objectWaterfall,
} from 'assets/images/rooms/14_office-ceo';
import { ost3 } from 'assets/sound/ost';

import { triggerDialogueModal } from 'layers/phaser/utils/triggerDialogueModal';
import { triggerNodeModal } from 'layers/phaser/utils/triggerNodeModal';
import { Room } from 'constants/phaser/rooms';

export const room14: Room = {
  location: 14,
  background: {
    key: 'bg_room014',
    path: backgroundDefault,
  },
  music: {
    key: 'ost3',
    path: ost3,
  },
  objects: [
    {
      key: 'occultcircle',
      path: objectOccultCircle,
      offset: { x: 37, y: 40 },
      onClick: triggerNodeModal,
    },
    {
      key: 'appleimac',
      path: objectImac,
      offset: { x: -12.4, y: 9.5 },
      onClick: () =>
        triggerDialogueModal([
          "An apple iMac. Looks like the G3, actually. There's no power cable, so it's dead.",
        ]),
    },
    {
      key: 'businesspaperwork',
      path: objectPaperwork,
      offset: { x: 7, y: 3.6 },
      onClick: () =>
        triggerDialogueModal(['A pile of documents. The writing is unreadable scrawl.']),
    },
    {
      key: 'smallwaterfall',
      path: objectWaterfall,
      offset: { x: -53.9, y: 5.6 },
      onClick: () => triggerDialogueModal(['A waterfall in the distance.']),
    },
  ],
};