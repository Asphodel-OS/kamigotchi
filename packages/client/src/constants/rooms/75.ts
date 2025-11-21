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
      coordinates: { x1: 0, y1: 0, x2: 0, y2: 0 },
      dialogue: 751,
    },
  ],
};
