import { bgPlaytestDay } from 'assets/images/rooms/47_scrap-paths';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

import { triggerGoalModal } from 'app/triggers/triggerGoalModal';

export const room47: Room = {
  roomIndex: 47,
  background: {
    key: 'bg_room47',
    path: bgPlaytestDay,
  },
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [
    {
      name: 'gate',
      coordinates: { x1: 30, y1: 55, x2: 75, y2: 105 },
      onClick: () => triggerGoalModal([1]),
    },
  ],
};
