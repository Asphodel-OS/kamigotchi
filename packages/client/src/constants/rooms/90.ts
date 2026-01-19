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
      coordinates: { x1: 20, y1: 20, x2: 110, y2: 99 },
      dialogue: 901,
    },
    {
      name: 'pipe',
      coordinates: { x1: 40, y1: 109, x2: 77, y2: 121 },
      dialogue: 902,
    },
  ],
};
