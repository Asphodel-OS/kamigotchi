import { triggerGoalModal } from 'app/triggers/triggerGoalModal';
import { bgPlaytestDay } from 'assets/images/rooms/34_deeper-into-scrap';
import { cave } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room34: Room = {
  roomIndex: 34,
  background: {
    key: 'bg_room34',
    path: bgPlaytestDay,
  },
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
