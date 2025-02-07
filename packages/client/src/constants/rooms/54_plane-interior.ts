import { triggerGoalModal } from 'app/triggers/triggerGoalModal';
import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/54_plane_interior';
import { cave } from 'assets/sound/ost';
import { Room } from './types';

export const room54: Room = {
  index: 54,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'cave',
    path: cave,
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
  ],
};
