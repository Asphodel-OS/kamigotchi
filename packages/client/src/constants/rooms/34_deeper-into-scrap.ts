import { triggerGoalModal } from 'app/triggers/triggerGoalModal';
import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/34_deeper-into-scrap';
import { cave } from 'assets/sound/ost';
import { Room } from './types';

export const room34: Room = {
  index: 34,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [
    {
      name: 'gate',
      coordinates: { x1: 60, y1: 55, x2: 105, y2: 105 },
      onClick: () => triggerGoalModal([2]),
    },
  ],
};
