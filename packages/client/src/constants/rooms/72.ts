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
  objects: [],
};
