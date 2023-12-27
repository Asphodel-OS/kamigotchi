import {
  backgroundDefault,
  objectBeetle4,
  objectCentipede,
  objectHollowTrunk,
  objectTermiteMound,
} from 'assets/images/rooms/10_forest-insect';
import { glitter } from 'assets/sound/ost';
import { Room } from 'constants/rooms';
import { triggerNodeModal } from 'layers/phaser/utils/triggers/triggerNodeModal';


export const room10: Room = {
  location: 10,
  background: {
    key: 'bg_room010',
    path: backgroundDefault,
  },
  music: {
    key: 'glitter',
    path: glitter,
  },
  objects: [
    {
      key: '10beetle4',
      path: objectBeetle4,
      offset: { x: -42.55, y: 38.6 },
      dialogue: 101,
    },
    {
      key: 'centipedeandgrub',
      path: objectCentipede,
      offset: { x: 41.6, y: 52.5 },
      dialogue: 102,
    },
    {
      key: 'foresttrunk',
      path: objectHollowTrunk,
      offset: { x: -53, y: -7 },
      dialogue: 103,
    },
    {
      key: 'termitemound',
      path: objectTermiteMound,
      offset: { x: 5.4, y: 1.5 },
      onClick: () => triggerNodeModal(3),
    },
  ],
};