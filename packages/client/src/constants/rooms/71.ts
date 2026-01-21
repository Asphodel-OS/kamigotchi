import { bgPlaytestDay } from 'assets/images/rooms/71_shabby-deck';
import { shabbyDeck } from 'assets/sound/ost';
import { Room } from './types';

export const room71: Room = {
  index: 71,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'shabbyDeck',
    path: shabbyDeck,
  },
  objects: [
    {
      name: 'bones',
      coordinates: { x1: 62, y1: 107, x2: 95, y2: 125 },
      dialogue: 711,
    },
    {
      name: 'broken window',
      coordinates: { x1: 30, y1: 20, x2: 50, y2: 60 },
      dialogue: 712,
    },
    {
      name: 'albino centipede',
      coordinates: { x1: 43, y1: 63, x2: 66, y2: 88 },
      dialogue: 713,
    },
  ],
};
