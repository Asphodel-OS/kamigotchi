import { bgPlaytestDay } from 'assets/images/rooms/79_abandoned-campsite';
import { abandonedCamp } from 'assets/sound/ost';
import { Room } from './types';

export const room79: Room = {
  index: 79,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'abandonedCamp',
    path: abandonedCamp,
  },
  objects: [
    {
      name: 'charcoal drawing',
      coordinates: { x1: 56, y1: 6, x2: 100, y2: 35 },
      dialogue: 791,
    },
    {
      name: 'makeshift tent',
      coordinates: { x1: 11, y1: 9, x2: 58, y2: 58 },
      dialogue: 792,
    },
  ],
};
