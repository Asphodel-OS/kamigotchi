import { bgPlaytestDay } from 'assets/images/rooms/84_reinforced-tunnel';
import { reinforcedTunnel } from 'assets/sound/ost';
import { Room } from './types';

export const room84: Room = {
  index: 84,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'reinforcedTunnel',
    path: reinforcedTunnel,
  },
  objects: [
    {
      name: 'purple hardback book',
      coordinates: { x1: 82, y1: 104, x2: 106, y2: 120 },
      dialogue: 841,
    },
    {
      name: 'mine tunnel note',
      coordinates: { x1: 34, y1: 45, x2: 54, y2: 65 },
      dialogue: 842,
    },
  ],
};
