import { bgPlaytestDay } from 'assets/images/rooms/72_hatch-to-nowhere';
import { hatchToNowhere } from 'assets/sound/ost';
import { Room } from './types';

export const room72: Room = {
  index: 72,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'hatchToNowhere',
    path: hatchToNowhere,
  },
  objects: [
    {
      name: 'exit',
      coordinates: { x1: 50, y1: 50, x2: 80, y2: 100 },
      dialogue: 721,
    },
    { name: 'damaged device', coordinates: { x1: 83, y1: 79, x2: 110, y2: 104 }, dialogue: 722 },
    {
      name: 'shattered tube',
      coordinates: { x1: 19, y1: 0, x2: 55, y2: 22 },
      dialogue: 723,
    },
  ],
};
