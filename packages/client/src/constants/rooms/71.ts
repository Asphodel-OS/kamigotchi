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
  objects: [],
};
