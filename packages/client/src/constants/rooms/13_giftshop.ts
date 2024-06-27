import { triggerLeaderboardModal } from 'app/triggers/triggerLeaderboardModal';
import { triggerShopModal } from 'app/triggers/triggerShopModal';
import { bgPlaytest } from 'assets/images/rooms/13_giftshop';
import { mystique } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room13: Room = {
  roomIndex: 13,
  background: {
    key: 'bg_room013',
    path: bgPlaytest,
  },
  music: {
    key: 'mystique',
    path: mystique,
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
