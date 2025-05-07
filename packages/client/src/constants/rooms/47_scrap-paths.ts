import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/47_scrap-paths';
import { Room } from './types';

import { triggerGoalModal } from 'app/triggers/triggerGoalModal';
import { cave } from 'assets/sound/ost';

export const room47: Room = {
  index: 47,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
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
