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
      coordinates: { x1: 0, y1: 0, x2: 0, y2: 0 },
      dialogue: 831,
    },
  ],
};
