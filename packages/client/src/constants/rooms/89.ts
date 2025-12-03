import { triggerGoalModal } from 'app/triggers';
import { bgPlaytestDay } from 'assets/images/rooms/89_trophies-of-the-hunt';
import { sextantRooms } from 'assets/sound/ost';
import { Room } from './types';

export const room89: Room = {
  index: 89,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'sextantRooms',
    path: sextantRooms,
  },
  objects: [
    {
      name: 'imp',
      coordinates: { x1: 45, y1: 45, x2: 80, y2: 100 },
      onClick: () => triggerGoalModal([9]),
    },
  ],
};
