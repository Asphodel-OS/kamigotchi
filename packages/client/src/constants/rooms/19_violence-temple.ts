import { bgPlaytest } from 'assets/images/rooms/19_violence-temple';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room19: Room = {
  roomIndex: 19,
  background: {
    key: 'bg_room19',
    path: bgPlaytest,
  },
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [
    // {
    //   // violencefloor
    //   coordinates: { x1: 0, y1: 0, x2: 20, y2: 20 },
    //   dialogue: 191,
    // },
    // {
    //   // dharmawheel
    //   coordinates: { x1: 0, y1: 0, x2: 20, y2: 20 },
    //   onClick: () => triggerLeaderboardModal(),
    // },
  ],
};
