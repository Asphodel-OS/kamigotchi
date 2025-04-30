import { bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight } from 'assets/images/rooms/3_gate';
import { arrival } from 'assets/sound/ost';
import { Room } from './types';

export const room03: Room = {
  index: 3,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'arrival',
    path: arrival,
  },
  objects: [
    // {
    //   name: 'torii gate',
    //   coordinates: { x1: 48, y1: 29, x2: 123, y2: 85 },
    //   onClick: () => triggerGoalModal([6]),
    // },
  ],
};
