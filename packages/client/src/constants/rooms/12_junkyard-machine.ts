import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/12_junkyard-machine';
import { mystique } from 'assets/sound/ost';
import { Room } from './types';

export const room12: Room = {
  index: 12,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
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
