import { bgPlaytestDay } from 'assets/images/rooms/75_flood-mural';
import { floodMural } from 'assets/sound/ost';
import { Room } from './types';

export const room75: Room = {
  index: 75,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'floodMural',
    path: floodMural,
  },
  objects: [
    {
      name: 'apocalypse mural',
      coordinates: { x1: 61, y1: 39, x2: 125, y2: 51 },
      dialogue: 751,
    },
  ],
};
