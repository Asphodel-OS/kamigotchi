import {
  backgroundDefault,
  objectBeetle1,
  objectBeetle2,
  objectBeetle3,
  objectBeetle4,
  objectSmallMushrooms,
} from 'assets/images/rooms/9_forest';
import { ost2 } from 'assets/sound/ost';
import { Room } from 'constants/phaser/rooms';


export const room9: Room = {
  location: 9,
  background: {
    key: 'bg_room009',
    path: backgroundDefault,
  },
  music: {
    key: 'ost2',
    path: ost2,
  },
  objects: [
    {
      key: 'beetle1',
      path: objectBeetle1,
      offset: { x: 53.5, y: -53.35 },
      dialogue: 91,
    },
    {
      key: 'beetle2',
      path: objectBeetle2,
      offset: { x: 11.5, y: -7 },
      dialogue: 92,
    },
    {
      key: 'beetle3',
      path: objectBeetle3,
      offset: { x: -59.5, y: -15.5 },
      dialogue: 93,
    },
    {
      key: 'beetle4',
      path: objectBeetle4,
      offset: { x: 43.5, y: 2 },
      dialogue: 94,
    },
    {
      key: 'smallmushrooms',
      path: objectSmallMushrooms,
      offset: { x: -52, y: 58 },
      dialogue: 95,
    },
  ],
};