import { bgPlaytestDay } from 'assets/images/rooms/12_junkyard-machine';
import { mystique } from 'assets/sound/ost';
import { Room } from 'constants/rooms';

export const room12: Room = {
  roomIndex: 12,
  background: {
    key: 'bg_room012',
    path: bgPlaytestDay,
  },
  music: {
    key: 'mystique',
    path: mystique,
  },
  objects: [
    // {
    //   // prayerwheels
    //   coordinates: { x1: 0, y1: 0, x2: 20, y2: 20 },
    //   onClick: () => triggerERC20BridgeModal(),
    // },
    // {
    //   // bellshapeddevice
    //   coordinates: { x1: 0, y1: 0, x2: 20, y2: 20 },
    //   onClick: () => triggerERC721BridgeModal(),
    // },
    // {
    //   // glassbox
    //   coordinates: { x1: 0, y1: 0, x2: 20, y2: 20 },
    //   dialogue: 121,
    // },
    // {
    //   // monolith
    //   coordinates: { x1: 0, y1: 0, x2: 20, y2: 20 },
    //   onClick: () => triggerNodeModal(5),
    // },
  ],
};
