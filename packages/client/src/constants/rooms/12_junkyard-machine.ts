import {
  backgroundDefault,
  objectBellShapedDevice,
  objectGlassBox,
  objectMonolith,
  objectPrayerWheels,
} from 'assets/images/rooms/12_junkyard-machine';
import { mystique } from 'assets/sound/ost';
import { Room } from 'constants/rooms';
import { triggerERC20BridgeModal } from 'layers/phaser/utils/triggers/triggerERC20BridgeModal';
import { triggerERC721BridgeModal } from 'layers/phaser/utils/triggers/triggerERC721BridgeModal';
import { triggerNodeModal } from 'layers/phaser/utils/triggers/triggerNodeModal';

export const room12: Room = {
  roomIndex: 12,
  background: {
    key: 'bg_room012',
    path: backgroundDefault,
  },
  music: {
    key: 'mystique',
    path: mystique,
  },
  objects: [
    {
      key: 'prayerwheels',
      path: objectPrayerWheels,
      offset: { x: -48.65, y: 13 },
      onClick: () => triggerERC20BridgeModal(),
    },
    {
      key: 'bellshapeddevice',
      path: objectBellShapedDevice,
      offset: { x: 39.04, y: -13.92 },
      onClick: () => triggerERC721BridgeModal(),
    },
    {
      key: 'glassbox',
      path: objectGlassBox,
      offset: { x: -9, y: -3.92 },
      dialogue: 121,
    },
    {
      key: 'monolith',
      path: objectMonolith,
      offset: { x: -48, y: -27.1 },
      onClick: () => triggerNodeModal(5),
    },
  ],
};
