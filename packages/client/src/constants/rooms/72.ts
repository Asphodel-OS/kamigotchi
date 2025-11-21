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
    {
      name: 'open hatch',
      coordinates: { x1: 0, y1: 0, x2: 0, y2: 0 },
      dialogue: 722,
    },
    {
      name: 'shattered tube',
      coordinates: { x1: 0, y1: 0, x2: 0, y2: 0 },
      dialogue: 723,
    },
    { name: 'damaged device', coordinates: { x1: 0, y1: 0, x2: 0, y2: 0 }, dialogue: 724 },
  ],
};
