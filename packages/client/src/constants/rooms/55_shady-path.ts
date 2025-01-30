import { triggerGoalModal } from 'app/triggers/triggerGoalModal';
import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/55_shady-path';
import { arrival } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room55: Room = {
  index: 55,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'arrival',
    path: arrival,
  },
  objects: [
    {
      name: 'goat',
      coordinates: { x1: 27, y1: 70, x2: 37, y2: 100 },
      onClick: () => triggerGoalModal([8]),
    },
  ],
};
