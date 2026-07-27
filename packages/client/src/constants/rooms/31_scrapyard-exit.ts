import { triggerPoolModal } from 'app/triggers/triggerPoolModal';
import {
  bgFountainDay,
  bgFountainEvening,
  bgFountainNight,
} from 'assets/images/rooms/31_scrapyard-exit';
import { cave } from 'assets/sound/ost';
import { Room } from './types';

export const room31: Room = {
  index: 31,
  backgrounds: [bgFountainDay, bgFountainEvening, bgFountainNight],
  music: {
    key: 'cave',
    path: cave,
  },
  objects: [
    {
      name: 'fountain',
      coordinates: { x1: 40, y1: 40, x2: 88, y2: 100 },
      onClick: () => triggerPoolModal(),
    },
  ],
};
