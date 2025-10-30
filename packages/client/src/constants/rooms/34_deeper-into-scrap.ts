import { triggerGoalModal } from 'app/triggers/triggerGoalModal';
import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/34_deeper-into-scrap';
import { k1 } from 'assets/sound/ost';
import { Room } from './types';

export const room34: Room = {
  index: 34,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'k1',
    path: k1,
  },
  objects: [
    {
      name: 'gate',
      coordinates: { x1: 60, y1: 55, x2: 105, y2: 105 },
      onClick: () => triggerGoalModal([2]),
    },
    {
      name: 'kami1',
      coordinates: { x1: 75, y1: 53, x2: 96, y2: 53 },
      onClick: () => {},
    },
    {
      name: 'kami2',
      coordinates: { x1: 33, y1: 12, x2: 63, y2: 68 },
      onClick: () => {},
    },
    {
      name: 'kami3',
      coordinates: { x1: 20, y1: 90, x2: 11, y2: 32 },
      onClick: () => {},
    },
  ],
};
