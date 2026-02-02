import { triggerGoalModal } from 'app/triggers';
import { bgPlaytestDay } from 'assets/images/rooms/85_giants-palm';
import { giantsPalm } from 'assets/sound/ost';
import { Room } from './types';

export const room85: Room = {
  index: 85,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'giantsPalm',
    path: giantsPalm,
  },
  objects: [
    {
      name: 'skeletal hand',
      coordinates: { x1: 72, y1: 80, x2: 136, y2: 130 },
      onClick: () => triggerGoalModal([7]),
    },
  ],
};
