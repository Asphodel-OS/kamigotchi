import { bgPlaytest } from 'assets/images/rooms/19_violence-temple';
import { k14 } from 'assets/sound/ost';
import { Room } from './types';

export const room19: Room = {
  index: 19,
  backgrounds: [bgPlaytest],
  music: {
    key: 'k14',
    path: k14,
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
