import { triggerGoalModal } from 'app/triggers';
import { bgPlaytestDay } from 'assets/images/rooms/89_trophies-of-the-hunt';
import { sextantRooms } from 'assets/sound/ost';
import { Room } from './types';

export const room89: Room = {
  index: 89,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'sextantRooms',
    path: sextantRooms,
  },
  objects: [
    {
      name: 'imp',
      coordinates: { x1: 45, y1: 45, x2: 80, y2: 100 },
      onClick: () => triggerGoalModal([9]),
    },
    { name: 'red birds', coordinates: { x1: 98, y1: 50, x2: 125, y2: 100 }, dialogue: 891 },
    {
      name: 'green dragon',
      coordinates: { x1: 26, y1: 0, x2: 73, y2: 27 },
      dialogue: 892,
    },
    /*   {
      name: 'central pedestal',
      coordinates: { x1: 45, y1: 40, x2: 82, y2: 105 },
      dialogue: 893,
    },*/
    {
      name: 'reptilian beaver',
      coordinates: { x1: 26, y1: 35, x2: 48, y2: 58 },
      dialogue: 894,
    },
    {
      name: 'blue sea creature',
      coordinates: { x1: 80, y1: 0, x2: 128, y2: 55 },
      dialogue: 895,
    },
  ],
};
