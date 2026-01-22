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
      coordinates: { x1: 90, y1: 44, x2: 128, y2: 74 },
      dialogue: 761,
    },
    {
      name: 'red mushrooms',
      coordinates: { x1: 58, y1: 42, x2: 78, y2: 60 },
      dialogue: 762,
    },
  ],
};
