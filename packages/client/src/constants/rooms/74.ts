import { triggerGoalModal } from 'app/triggers';
import { bgPlaytestDay } from 'assets/images/rooms/74_engraved-door';
import { engravedDoor } from 'assets/sound/ost';
import { Room } from './types';

export const room74: Room = {
  index: 74,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'engravedDoor',
    path: engravedDoor,
  },
  objects: [
    {
      name: 'gate',
      coordinates: { x1: 20, y1: 0, x2: 110, y2: 80 },
      onClick: () => triggerGoalModal([8]),
    },
  ],
};
