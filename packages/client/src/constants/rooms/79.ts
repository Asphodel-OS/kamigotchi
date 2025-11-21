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
      coordinates: { x1: 0, y1: 0, x2: 0, y2: 0 },
      dialogue: 791,
    },
    {
      name: 'makeshift tent',
      coordinates: { x1: 0, y1: 0, x2: 0, y2: 0 },
      dialogue: 792,
    },
  ],
};
