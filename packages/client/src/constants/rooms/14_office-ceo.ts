import {
  bgPlaytestDay,
  bgPlaytestEvening,
  bgPlaytestNight,
} from 'assets/images/rooms/14_office-ceo';
import { abandoned } from 'assets/sound/ost';
import { Room } from './types';

export const room14: Room = {
  index: 14,
  backgrounds: [bgPlaytestDay, bgPlaytestEvening, bgPlaytestNight],
  music: {
    key: 'abandoned',
    path: abandoned,
  },
  objects: [
    // {
    //   // occultcircle
    //   coordinates: { x1: 0, y1: 0, x2: 20, y2: 20 },
    //   onClick: () => triggerNodeModal(4),
    // },
    // {
    //   // appleimac
    //   coordinates: { x1: 0, y1: 0, x2: 20, y2: 20 },
    //   dialogue: 141,
    // },
    // {
    //   // businesspaperwork
    //   coordinates: { x1: 0, y1: 0, x2: 20, y2: 20 },
    //   dialogue: 142,
    // },
    // {
    //   // smallwaterfall
    //   coordinates: { x1: 0, y1: 0, x2: 20, y2: 20 },
    //   dialogue: 143,
    // },
  ],
};
