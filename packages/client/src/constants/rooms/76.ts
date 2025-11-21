import { bgPlaytestDay } from 'assets/images/rooms/76_fungus-garden';
import { fungusGarden } from 'assets/sound/ost';
import { Room } from './types';

export const room76: Room = {
  index: 76,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'fungusGarden',
    path: fungusGarden,
  },
  objects: [
    {
      name: 'purple mushrooms',
      coordinates: { x1: 0, y1: 0, x2: 0, y2: 0 },
      dialogue: 761,
    },
    {
      name: 'red mushrooms',
      coordinates: { x1: 0, y1: 0, x2: 0, y2: 0 },
      dialogue: 762,
    },
  ],
};
