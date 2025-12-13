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
      coordinates: { x1: 105, y1: 25, x2: 135, y2: 75 },
      onClick: () => triggerGoalModal([6]),
    },
    {
      name: 'coop trigger',
      coordinates: { x1: 0, y1: 15, x2: 25, y2: 45 },
      onClick: () => triggerGoalModal([6]),
    },
  ],
};
