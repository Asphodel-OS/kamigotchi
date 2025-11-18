import { bgPlaytestDay } from 'assets/images/rooms/15_temple-cave';
import { templeCave } from 'assets/sound/ost';
import { Room } from './types';

export const room15: Room = {
  index: 15,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'templeCave',
    path: templeCave,
  },
  objects: [],
};
