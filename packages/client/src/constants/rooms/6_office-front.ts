import {
  backgroundDefault,
  objectBuildingLogo,
  objectFoxStatues,
} from 'assets/images/rooms/6_office-front';
import { amusement } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room6: Room = {
  location: 6,
  background: {
    key: 'bg_room006',
    path: backgroundDefault,
  },
  music: {
    key: 'amusement',
    path: amusement,
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
