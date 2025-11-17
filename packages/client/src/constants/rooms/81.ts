import { bgPlaytestDay } from 'assets/images/rooms/81_flower-mural';
import { charcoalMural } from 'assets/sound/ost';
import { Room } from './types';

export const room81: Room = {
  index: 81,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'charcoalMural',
    path: charcoalMural,
  },
  objects: [],
};
