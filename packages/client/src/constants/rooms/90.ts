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
  objects: [],
};
