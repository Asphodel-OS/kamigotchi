import { triggerGoalModal } from 'app/triggers/triggerGoalModal';
import { bgPlaytestDay } from 'assets/images/rooms/77_thriving-mushrooms';
import { thrivingMushrooms } from 'assets/sound/ost';
import { Room } from './types';

export const room77: Room = {
  index: 77,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'thrivingMushrooms',
    path: thrivingMushrooms,
  },
  objects: [
    {
      name: 'coop trigger',
      coordinates: { x1: 110, y1: 30, x2: 130, y2: 70 },
      onClick: () => triggerGoalModal([6]),
    },
    {
      name: 'coop trigger',
      coordinates: { x1: 5, y1: 20, x2: 20, y2: 40 },
      onClick: () => triggerGoalModal([6]),
    },
  ],
};
