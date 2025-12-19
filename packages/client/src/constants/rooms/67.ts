import { triggerGoalModal } from 'app/triggers/triggerGoalModal';
import { bgChristmasEvening } from 'assets/images/rooms/67_boulder-tunnel';
import { collapsedTunnel } from 'assets/sound/ost';
import { Room } from './types';

export const room67: Room = {
  index: 67,
  backgrounds: [bgChristmasEvening],
  music: {
    key: 'collapsedTunnel',
    path: collapsedTunnel,
  },
  objects: [
    {
      name: 'gate',
      coordinates: { x1: -15, y1: 50, x2: 25, y2: 100 },
      onClick: () => triggerGoalModal([5]),
    },
  ],
};
