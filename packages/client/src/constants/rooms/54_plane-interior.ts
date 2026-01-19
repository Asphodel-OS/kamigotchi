import { triggerGoalModal } from 'app/triggers/triggerGoalModal';
import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/54_plane_interior';
import { k2 } from 'assets/sound/ost';
import { Room } from './types';

export const room54: Room = {
  index: 54,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'k2',
    path: k2,
  },
  objects: [
    {
      name: 'idol',
      coordinates: { x1: 54, y1: 44, x2: 72, y2: 78 },
      onClick: () => triggerGoalModal([4]),
    },
    {
      name: 'plane exit',
      coordinates: { x1: 52, y1: 110, x2: 76, y2: 130 },
      dialogue: 541,
    },
    {
      name: 'egg',
      coordinates: { x1: 49, y1: 70, x2: 55, y2: 80 },
      dialogue: 542,
    },
    {
      name: 'screens',
      coordinates: { x1: 96, y1: 45, x2: 126, y2: 79 },
      dialogue: 543,
    },
    {
      name: 'exotic pelts',
      coordinates: { x1: 95, y1: 91, x2: 123, y2: 103 },
      dialogue: 544,
    },
    {
      name: 'ancient drawing',
      coordinates: { x1: 35, y1: 0, x2: 95, y2: 20 },
      dialogue: 545,
    },
    {
      name: 'leather-bound book',
      coordinates: { x1: 108, y1: 80, x2: 126, y2: 89 },
      dialogue: 546,
    },
  ],
};
