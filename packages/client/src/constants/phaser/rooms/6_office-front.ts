import {
  backgroundDefault,
  objectBuildingLogo,
  objectFoxStatues,
} from 'assets/images/rooms/6_office-front';
import { ost1 } from 'assets/sound/ost';
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
      dialogue: 61,
    },
    {
      key: 'foxstatues',
      path: objectFoxStatues,
      offset: { x: 0, y: 28 },
      dialogue: 62,
    },
  ],
};