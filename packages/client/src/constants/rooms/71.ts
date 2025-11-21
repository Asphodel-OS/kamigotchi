import { bgChristmas } from 'assets/images/rooms/71_shabby-deck';
import { shabbyDeck } from 'assets/sound/ost';
import { Room } from './types';

export const room71: Room = {
  index: 71,
  backgrounds: [bgChristmas],
  music: {
    key: 'shabbyDeck',
    path: shabbyDeck,
  },
  objects: [
    {
      name: 'bones',
      coordinates: { x1: 0, y1: 0, x2: 0, y2: 0 },
      dialogue: 711,
    },
    {
      name: 'broken window',
      coordinates: { x1: 0, y1: 0, x2: 0, y2: 0 },
      dialogue: 712,
    },
    {
      name: 'albino centipede',
      coordinates: { x1: 0, y1: 0, x2: 0, y2: 0 },
      dialogue: 713,
    },
  ],
};
