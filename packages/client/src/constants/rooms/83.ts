import { bgPlaytestDay } from 'assets/images/rooms/83_canyon-bridge';
import { canyonBridge } from 'assets/sound/ost';
import { Room } from './types';

export const room83: Room = {
  index: 83,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'canyonBridge',
    path: canyonBridge,
  },
  objects: [
    {
      name: 'bridge',
      coordinates: { x1: 30, y1: 50, x2: 100, y2: 95 },
      dialogue: 831,
    },
  ],
};
