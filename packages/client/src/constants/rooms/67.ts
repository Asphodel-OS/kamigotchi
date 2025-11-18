import { bgPlaytestDay } from 'assets/images/rooms/67_boulder-tunnel';
import { collapsedTunnel } from 'assets/sound/ost';
import { Room } from './types';

export const room67: Room = {
  index: 67,
  backgrounds: [bgPlaytestDay],
  music: {
    key: 'collapsedTunnel',
    path: collapsedTunnel,
  },
  objects: [],
};
