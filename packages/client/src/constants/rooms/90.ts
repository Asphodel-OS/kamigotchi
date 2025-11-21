import { bgPlaytestDay } from 'assets/images/rooms/90_scenic-view';
import { scenicView } from 'assets/sound/ost';
import { Room } from './types';

export const room90: Room = {
  index: 90,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'scenicView',
    path: scenicView,
  },
  objects: [
    {
      name: 'dragons',
      coordinates: { x1: 0, y1: 0, x2: 0, y2: 0 },
      dialogue: 901,
    },
    {
      name: 'pipe',
      coordinates: { x1: 0, y1: 0, x2: 0, y2: 0 },
      dialogue: 902,
    },
  ],
};
