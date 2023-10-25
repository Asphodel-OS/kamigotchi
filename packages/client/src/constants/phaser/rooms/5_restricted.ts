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
      dialogue: [
        'This road has been poorly maintained, but the cherry trees around it are thriving and elegantly posed.',
        'The writing on the sign itself doesn\'t make any sense, but red usually means danger.',
      ],
    },
    {
      key: 'acompanybuilding',
      path: objectCompanyBuilding,
      offset: { x: -30.1, y: -35 },
      dialogue: [
        'A tall office - like building with the letter A on it.The sun reflecting on the windows makes it sparkle. Curiously, but not unusually, straight.',
        'That\'s just how buildings are, before you get to know their odds and bends.',
      ],
    },
    {
      key: 'warningsign',
      path: objectWarningSign,
      offset: { x: 10.5, y: 39.6 },
      dialogue: [
        'This road has been poorly maintained, but the cherry trees around it are thriving and elegantly posed.',
        'The writing on the sign itself doesn\'t make any sense, but red usually means danger.',
      ],
    },
  ],
};