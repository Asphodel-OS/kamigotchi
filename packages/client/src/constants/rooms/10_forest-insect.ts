import { triggerGoalModal } from 'app/triggers/triggerGoalModal';
import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/10_forest-insect';
import { k4 } from 'assets/sound/ost';
import { Room } from './types';

export const room10: Room = {
  index: 10,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'k4',
    path: k4,
  },
  objects: [
    {
      name: 'beetle 5',
      coordinates: { x1: 13, y1: 95, x2: 31, y2: 110 },
      dialogue: 101,
    },
    {
      name: 'centipede and grub',
      coordinates: { x1: 86, y1: 107, x2: 125, y2: 125 },
      dialogue: 102,
    },
    {
      name: 'forest trunk',
      coordinates: { x1: 5, y1: 45, x2: 20, y2: 70 },
      dialogue: 103,
    },
    {
      name: 'gate',
      coordinates: { x1: 40, y1: 40, x2: 100, y2: 120 },
      onClick: () => triggerGoalModal([3]),
    },
  ],
};
