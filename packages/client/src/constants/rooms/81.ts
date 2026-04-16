import { bgPlaytestDay } from 'assets/images/rooms/81_flower-mural';
import { charcoalMural } from 'assets/sound/ost';
import { Room } from './types';

export const room81: Room = {
  index: 81,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'charcoalMural',
    path: charcoalMural,
  },
  objects: [
    {
      name: 'scraps',
      coordinates: { x1: 39, y1: 77, x2: 90, y2: 90 },
      dialogue: 811,
    },
    {
      name: 'flower mural',
      coordinates: { x1: 40, y1: 10, x2: 90, y2: 60 },
      dialogue: 812,
    },
  ],
};
