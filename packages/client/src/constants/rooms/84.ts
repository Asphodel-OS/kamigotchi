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
      coordinates: { x1: 0, y1: 0, x2: 0, y2: 0 },
      dialogue: 841,
    },
    {
      name: 'mine tunnel note',
      coordinates: { x1: 0, y1: 0, x2: 0, y2: 0 },
      dialogue: 842,
    },
  ],
};
