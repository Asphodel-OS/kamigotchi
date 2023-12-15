import {
  backgroundDefault,
  backgroundOld,
  objectImac,
  objectOccultCircle,
  objectPaperwork,
  objectWaterfall,
} from 'assets/images/rooms/14_office-ceo';
import { abandoned } from 'assets/sound/ost';
import { Room } from 'constants/rooms';
import { triggerNodeModal } from 'layers/phaser/utils/triggerNodeModal';


export const room14: Room = {
  location: 14,
  background: {
    key: 'bg_room014',
    path: backgroundDefault,
  },
  music: {
    key: 'abandoned',
    path: abandoned,
  },
  objects: [
    {
      key: 'occultcircle',
      path: objectOccultCircle,
      offset: { x: 37, y: 40 },
      onClick: () => triggerNodeModal(4),
    },
    {
      key: 'appleimac',
      path: objectImac,
      offset: { x: -12.4, y: 9.5 },
      dialogue: 141,
    },
    {
      key: 'businesspaperwork',
      path: objectPaperwork,
      offset: { x: 7, y: 3.6 },
      dialogue: 142,
    },
    {
      key: 'smallwaterfall',
      path: objectWaterfall,
      offset: { x: -53.9, y: 5.6 },
      dialogue: 143,
    },
  ],
};