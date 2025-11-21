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
      coordinates: { x1: 0, y1: 0, x2: 0, y2: 0 },
      dialogue: 811,
    },
    {
      name: 'flower mural',
      coordinates: { x1: 0, y1: 0, x2: 0, y2: 0 },
      dialogue: 812,
    },
  ],
};
