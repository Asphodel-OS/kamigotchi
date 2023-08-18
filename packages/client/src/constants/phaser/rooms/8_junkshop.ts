import {
  backgroundDefault,
  backgroundOld,
  objectMonitors,
  objectPoster,
  objectVendingWall,
} from 'assets/images/rooms/8_junkshop';
import { ost3 } from 'assets/sound/ost';

import { triggerDialogueModal } from 'layers/phaser/utils/triggerDialogueModal';
import { Room } from 'constants/phaser/rooms';

export const room8: Room = {
  location: 8,
  background: {
    key: 'bg_room008',
    path: backgroundDefault,
  },
  music: {
    key: 'ost3',
    path: ost3,
  },
  objects: [
    {
      key: 'junkmonitors',
      path: objectMonitors,
      offset: { x: 54, y: 17 },
      onClick: () =>
        triggerDialogueModal([
          'These appear to be junked computer monitors. It looks like someone was working on them.',
        ]),
    },
    {
      key: 'junkvendingwall',
      path: objectVendingWall,
      offset: { x: -47.5, y: -4.5 },
      onClick: () =>
        triggerDialogueModal([
          "A wall that vends junk. This is probably where you'll be able to get mods.",
        ]),
    },
    {
      key: 'poster',
      path: objectPoster,
      offset: { x: 35.5, y: -1.4 },
      onClick: () =>
        triggerDialogueModal(['A poster of no particular importance. Possibly too much.']),
    },
  ],
};