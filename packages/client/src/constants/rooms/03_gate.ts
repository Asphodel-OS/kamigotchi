import { bgPlaytestDay, objectToriiGate } from 'assets/images/rooms/3_gate';
import { arrival } from 'assets/sound/ost';
import { Room } from 'constants/rooms';
import { triggerNodeModal } from 'layers/phaser/utils/triggers/triggerNodeModal';

export const room03: Room = {
  roomIndex: 3,
  background: {
    key: 'bg_room003',
    path: bgPlaytestDay,
  },
  music: {
    key: 'arrival',
    path: arrival,
  },
  objects: [
    {
      key: 'toriigate',
      path: objectToriiGate,
      offset: { x: 21, y: -8 },
      onClick: () => triggerNodeModal(1),
    },
  ],
};
