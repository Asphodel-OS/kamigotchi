import { triggerLeaderboardModal } from 'app/triggers/triggerLeaderboardModal';
import { triggerShopModal } from 'app/triggers/triggerShopModal';
import { bgPlaytest } from 'assets/images/rooms/13_giftshop';
import { mina } from 'assets/sound/ost';
import { Room } from './types';

export const room13: Room = {
  index: 13,
  backgrounds: [bgPlaytest],
  music: {
    key: 'mina',
    path: mina,
  },
  objects: [
    {
      name: 'clock',
      coordinates: { x1: 75, y1: 33, x2: 96, y2: 53 },
      dialogue: 131,
    },
    {
      name: 'mina',
      coordinates: { x1: 33, y1: 12, x2: 63, y2: 68 },
      dialogue: 132,
    },
    {
      name: 'exit',
      coordinates: { x1: 83, y1: 17, x2: 111, y2: 32 },
      dialogue: 133,
    },
    {
      name: 'cashregister',
      coordinates: { x1: 0, y1: 38, x2: 27, y2: 73 },
      onClick: () => triggerShopModal(1),
    },
    {
      name: 'leaderboard',
      coordinates: { x1: 117, y1: 27, x2: 128, y2: 49 },
      onClick: () => triggerLeaderboardModal('minaSpent'),
    },
  ],
};
