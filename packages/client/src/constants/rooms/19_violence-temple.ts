import {
  backgroundDefault,
  path18,
  objectDharmaWheel,
} from 'assets/images/rooms/19_violence-temple';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';
import { triggerLeaderboardModal } from 'layers/phaser/utils/triggerLeaderboardModal';


export const room19: Room = {
  location: 19,
  background: {
    key: 'bg_room19',
    path: backgroundDefault,
  },
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [
    {
      key: 'violencefloor',
      path: path18,
      offset: { x: -4, y: 59.1 },
      dialogue: 191,
    },
    {
      key: 'dharmawheel',
      path: objectDharmaWheel,
      offset: { x: 0, y: 0 },
      onClick: () => triggerLeaderboardModal(),
    },
  ],
};