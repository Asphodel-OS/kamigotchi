import {
  backgroundDefault,
  objectCompanyBuilding,
  objectTrashBag,
  objectWarningSign,
} from 'assets/images/rooms/5_restricted';
import { ost1 } from 'assets/sound/ost';
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
      dialogue: 51,
    },
    {
      key: 'acompanybuilding',
      path: objectCompanyBuilding,
      offset: { x: -30.1, y: -35 },
      dialogue: 52,
    },
    {
      key: 'warningsign',
      path: objectWarningSign,
      offset: { x: 10.5, y: 39.6 },
      dialogue: 53,
    },
  ],
};