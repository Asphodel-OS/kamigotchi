import { bgPlaytestDay } from 'assets/images/rooms/82_geometric-cliffs';
import { geometricCliffs } from 'assets/sound/ost';
import { Room } from './types';

export const room82: Room = {
  index: 82,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'geometricCliffs',
    path: geometricCliffs,
  },
  objects: [
    {
      name: 'blue lantern',
      coordinates: { x1: 85, y1: 95, x2: 100, y2: 120 },
      dialogue: 821,
    },
  ],
};
