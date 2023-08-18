import {
  cashregister,
  prayerwheels,
  bellshapeddevice,
  glassbox,
  occultcircle,
  monolith,
  beetle4,
  centipedeandgrub,
  foresttrunk,
  termitemound,
  appleimac,
  businesspaperwork,
  smallwaterfall,
  mina,
  emaboard,
  stonelantern,
  waterfall,
  smallshrine,
} from 'assets/images/objects';

import {
  room10,
  room11,
  room12,
  room13,
  room14,
  room15,
  room16,
  room17,
  room18,
  room19,
} from 'assets/images/rooms';

import { forest, opening, ost1, ost2, ost3 } from 'assets/sound/ost';
import { triggerDialogueModal } from 'layers/phaser/utils/triggerDialogueModal';
import { triggerERC20BridgeModal } from 'layers/phaser/utils/triggerERC20BridgeModal';
import { triggerERC721BridgeModal } from 'layers/phaser/utils/triggerERC721BridgeModal';
import { triggerShopModal } from 'layers/phaser/utils/triggerShopModal';
import { triggerPetNamingModal } from 'layers/phaser/utils/triggerPetNamingModal';
import { triggerNodeModal } from 'layers/phaser/utils/triggerNodeModal';
import { triggerRoomMovementModal } from 'layers/phaser/utils/triggerRoomMovementModal';
import { roomObjectsWorld1, roomObjectsWorld2 } from 'assets/images/room objects';
import { triggerLeaderboardModal } from 'layers/phaser/utils/triggerLeaderboardModal';


import { room1 } from './1_mistyriver';
import { room2 } from './2_treetunnel';
import { room3 } from './3_gate';
import { room4 } from './4_junkyard';
import { room5 } from './5_restricted';
import { room6 } from './6_office-front';
import { room7 } from './7_office-lobby';
import { room8 } from './8_junkshop';
import { room9 } from './9_forest';

// NOTE: This is the most horrendous, hardcoded known to mankind. We should
// move most things here to the store and populate the information from onchain.

// represents a room in all its glory
export interface Room {
  location: number;
  background?: RoomAsset;
  music?: RoomMusic;
  objects?: RoomAsset[];
}

// represents the configuration of a visual media asset in a room
interface RoomAsset {
  key: string;
  path: string;
  offset?: { x: number; y: number };
  onClick?: Function;
}

// represents the music in a room
interface RoomMusic {
  key: string;
  path: string;
}

export const duplicateRoomMusic = [
  [1, 2, 3],
  [5, 6],
  [9, 10, 11],
  [7, 8, 14],
  [4, 9, 10, 12, 13],
];

// all our lovely, hardcoded room details
export const rooms: Room[] = [
  { location: 0 },
  room1,
  room2,
  room3,
  room4,
  room5,
  room6,
  room7,
  room8,
  room9,
  {
    location: 10,
    background: {
      key: 'bg_room010',
      path: room10,
    },
    music: {
      key: 'ost2',
      path: ost2,
    },
    objects: [
      {
        key: 'beetle4',
        path: beetle4,
        offset: { x: -42.55, y: 38.6 },
        onClick: () => triggerDialogueModal(['Beetle four. The black sheep.']),
      },
      {
        key: 'centipedeandgrub',
        path: centipedeandgrub,
        offset: { x: 41.6, y: 52.5 },
        onClick: () =>
          triggerDialogueModal([
            'A centipede and a grub. The relationship between them is ambiguous and of great interest to the beetles nearby.',
          ]),
      },
      {
        key: 'foresttrunk',
        path: foresttrunk,
        offset: { x: -53, y: -7 },
        onClick: () =>
          triggerDialogueModal([
            "A hollow tree-trunk. This should obviously have a secret item or something in it, right? To be honest, we haven't implemented those yet.",
          ]),
      },
      {
        key: 'termitemound',
        path: termitemound,
        offset: { x: 5.4, y: 1.5 },
        onClick: triggerNodeModal,
      },
    ],
  },
  {
    location: 11,
    background: {
      key: 'bg_room011',
      path: room11,
    },
    music: {
      key: 'ost2',
      path: ost2,
    },
    objects: [
      {
        key: 'emaboard',
        path: emaboard,
        offset: { x: 45.5, y: 31 },
        onClick: triggerPetNamingModal,
      },
      {
        key: 'stonelantern',
        path: stonelantern,
        offset: { x: -50.4, y: 34.6 },
        onClick: () => triggerDialogueModal(['A stone lantern. Very roughly carved.']),
      },
      {
        key: 'waterfall',
        path: waterfall,
        offset: { x: 22.6, y: -33.5 },
        onClick: () => triggerRoomMovementModal(15),
      },
      {
        key: 'smallshrine',
        path: smallshrine,
        offset: { x: -5.48, y: 16.1 },
        onClick: () =>
          triggerDialogueModal([
            'A small shrine. This almost has the energy of a Node, but something is off...',
          ]),
      },
    ],
  },
  {
    location: 12,
    background: {
      key: 'bg_room012',
      path: room12,
    },
    music: {
      key: 'forest',
      path: forest,
    },
    objects: [
      {
        key: 'prayerwheels',
        path: prayerwheels,
        offset: { x: -48.65, y: 13 },
        onClick: () => triggerERC20BridgeModal(),
      },
      {
        key: 'bellshapeddevice',
        path: bellshapeddevice,
        offset: { x: 39.04, y: -13.92 },
        onClick: () => triggerERC721BridgeModal(),
      },
      {
        key: 'glassbox',
        path: glassbox,
        offset: { x: -9, y: -3.92 },
        onClick: () =>
          triggerDialogueModal(['This device will allow you to view information about balances.']),
      },
      {
        key: 'monolith',
        path: monolith,
        offset: { x: -48, y: -27.1 },
        onClick: triggerNodeModal,
      },
    ],
  },
  {
    location: 13,
    background: {
      key: 'bg_room013',
      path: room13,
    },
    music: {
      key: 'forest',
      path: forest,
    },
    objects: [
      {
        key: 'cashregister',
        path: cashregister,
        offset: { x: -50.5, y: -8.02 },
        onClick: triggerShopModal,
      },
      {
        key: 'mina',
        path: mina,
        offset: { x: -15, y: -24.6 },
        onClick: () =>
          triggerDialogueModal([
            "Mina doesn't want to talk to you. Perhaps her dialogue will be implemented soon.",
          ]),
      },
    ],
  },
  {
    location: 14,
    background: {
      key: 'bg_room014',
      path: room14,
    },
    music: {
      key: 'ost3',
      path: ost3,
    },
    objects: [
      {
        key: 'occultcircle',
        path: occultcircle,
        offset: { x: 37, y: 40 },
        onClick: triggerNodeModal,
      },
      {
        key: 'appleimac',
        path: appleimac,
        offset: { x: -12.4, y: 9.5 },
        onClick: () =>
          triggerDialogueModal([
            "An apple Imac. Looks like the G3, actually. There's no power cable, so it's dead.",
          ]),
      },
      {
        key: 'businesspaperwork',
        path: businesspaperwork,
        offset: { x: 7, y: 3.6 },
        onClick: () =>
          triggerDialogueModal(['A pile of documents. The writing is unreadable scrawl.']),
      },
      {
        key: 'smallwaterfall',
        path: smallwaterfall,
        offset: { x: -53.9, y: 5.6 },
        onClick: () => triggerDialogueModal(['A waterfall in the distance.']),
      },
    ],
  },
  {
    location: 15,
    background: {
      key: 'bg_room15',
      path: room15,
    },
    music: {
      key: 'ost3',
      path: ost3,
    },
    objects: [
      {
        key: 'templegrass',
        path: roomObjectsWorld2.path15to11,
        offset: { x: -8.5, y: 57 },
        onClick: () => triggerRoomMovementModal(11),
      },
      {
        key: 'templedoor',
        path: roomObjectsWorld2.path15to16,
        offset: { x: 41.3, y: -8.7 },
        onClick: () => triggerRoomMovementModal(16),
      },
      {
        key: 'templecave',
        path: roomObjectsWorld2.path15to18,
        offset: { x: -18, y: -15 },
        onClick: () => triggerRoomMovementModal(18),
      },
    ],
  },
  {
    location: 16,
    background: {
      key: 'bg_room16',
      path: room16,
    },
    music: {
      key: 'ost3',
      path: ost3,
    },
    objects: [
      {
        key: 'technofloor',
        path: roomObjectsWorld2.path16to15,
        offset: { x: 0, y: 59.1 },
        onClick: () => triggerRoomMovementModal(15),
      },
    ],
  },
  {
    location: 17,
    background: {
      key: 'bg_room17',
      path: room17,
    },
    music: {
      key: 'ost3',
      path: ost3,
    },
  },
  {
    location: 18,
    background: {
      key: 'bg_room18',
      path: room18,
    },
    music: {
      key: 'ost3',
      path: ost3,
    },
    objects: [
      {
        key: 'cavefloor',
        path: roomObjectsWorld2.path18to15,
        offset: { x: 25, y: 53.1 },
        onClick: () => triggerRoomMovementModal(15),
      },
      {
        key: 'cavecrossleft',
        path: roomObjectsWorld2.path18to19,
        offset: { x: -46, y: -5.8 },
        onClick: () => triggerRoomMovementModal(19),
      },
      {
        key: 'cavecrossright',
        path: roomObjectsWorld2.path18to20,
        offset: { x: 18.5, y: -19.7 },
        onClick: () => triggerRoomMovementModal(15),
      },
    ],
  },
  {
    location: 19,
    background: {
      key: 'bg_room19',
      path: room19,
    },
    music: {
      key: 'ost3',
      path: ost3,
    },
    objects: [
      {
        key: 'violencefloor',
        path: roomObjectsWorld2.path19to18,
        offset: { x: -4, y: 59.1 },
        onClick: () => triggerRoomMovementModal(18),
      },
      {
        key: 'dharmawheel',
        path: roomObjectsWorld2.dharmawheel,
        offset: { x: 0, y: 0 },
        onClick: () => triggerLeaderboardModal(),
      },
    ],
  },
];
