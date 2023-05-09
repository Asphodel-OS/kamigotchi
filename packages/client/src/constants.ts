import {
  vendingmachine,
  mooringpost,
  toriigate,
  hollowstump,
  gate,
  shopdoor,
  cashregister,
  prayerwheels,
  bellshapeddevice,
  glassbox,
  trashbag,
  acompanybuilding,
  abuildinglogo,
  foxstatues,
  chair,
  cabinet,
} from 'assets/images/objects';

import {
  room1,
  room2,
  room3,
  room4,
  room5,
  room6,
  room7,
  room8,
  room9,
  room10,
  room11,
  room12,
  room13,
  room14,
} from 'assets/images/rooms';

import {
  room1Music,
  forest,
  room3Music,
  room4Music,
  room5Music,
  room6Music,
  room7Music,
  room8Music,
  room9Music,
  room10Music,
  room11Music,
  room12Music,
  room13Music,
  room14Music,
} from 'assets/sound/ost';
import { triggerPetMintModal } from 'layers/phaser/utils/triggerPetMintModal';
import { triggerDialogueModal } from 'layers/phaser/utils/triggerDialogueModal';
import { triggerNodeModal } from 'layers/phaser/utils/triggerNodeModal';
import { triggerShopModal } from 'layers/phaser/utils/triggerShopModal';

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
  [2, 3],
  [5, 6],
  [9, 10],
  [7, 8, 14],
];

// all our lovely, hardcoded room details
export const rooms: Room[] = [
  {
    location: 0,
    background: {
      key: 'bg_room001',
      path: room1,
    },
    music: {
      key: 'm_room001',
      path: room1Music,
    },
    objects: [],
  },
  {
    location: 1,
    background: {
      key: 'bg_room001',
      path: room1,
    },
    music: {
      key: 'm_room001',
      path: room1Music,
    },
    objects: [
      {
        key: 'mooringpost',
        path: mooringpost,
        offset: { x: -19, y: 38 },
        onClick: () =>
          triggerDialogueModal([
            "This looks like a post for mooring boats. But there's no boats here.",
          ]),
      },
    ],
  },
  {
    location: 2,
    background: {
      key: 'bg_room002',
      path: room2,
    },
    music: {
      key: 'm_room002',
      path: room3Music,
    },
    objects: [
      {
        key: 'hollowstump',
        path: hollowstump,
        offset: { x: -48.5, y: 29.5 },
        onClick: () =>
          triggerDialogueModal([
            "It's a hollow tree stump. There doesn't appear to be anything inside.",
          ]),
      },
      {
        key: 'gate',
        path: gate,
        offset: { x: -39.5, y: -33.5 },
        onClick: () => triggerDialogueModal(["There's some sort of gate in the distance."]),
      },
      {
        key: 'shopdoor',
        path: shopdoor,
        offset: { x: 5, y: -7 },
        onClick: () =>
          triggerDialogueModal([
            'Wow. A shop. Maybe you can buy food here. Go west to enter.',
            'read more',
          ]),
      },
    ],
  },
  {
    location: 3,
    background: {
      key: 'bg_room003',
      path: room3,
    },
    music: {
      key: 'm_room003',
      path: room3Music,
    },
    objects: [
      {
        key: 'toriigate',
        path: toriigate,
        offset: { x: 21, y: -8 },
        onClick: triggerNodeModal,
      },
    ],
  },
  {
    location: 4,
    background: {
      key: 'bg_room004',
      path: room4,
    },
    music: {
      key: 'm_room004',
      path: room4Music,
    },
    objects: [
      {
        key: 'vendingmachine',
        path: vendingmachine,
        offset: { x: -33.5, y: 9.5 },
        onClick: triggerPetMintModal,
      },
    ],
  },
  {
    location: 5,
    background: {
      key: 'bg_room005',
      path: room5,
    },
    music: {
      key: 'm_room005',
      path: room5Music,
    },
    objects: [
      {
        key: 'trashbag',
        path: trashbag,
        offset: { x: -55.5, y: 50 },
        onClick: () => triggerDialogueModal(['A bag of trash. Looks worthless.']),
      },
      {
        key: 'acompanybuilding',
        path: acompanybuilding,
        offset: { x: -30.1, y: -35 },
        onClick: () =>
          triggerDialogueModal(["There's a huge office building here for some reason."]),
      },
    ],
  },
  {
    location: 6,
    background: {
      key: 'bg_room006',
      path: room6,
    },
    music: {
      key: 'm_room006',
      path: room5Music,
    },
    objects: [
      {
        key: 'abuildinglogo',
        path: abuildinglogo,
        offset: { x: 0, y: -45 },
        onClick: () => triggerDialogueModal(['Looks like their logo.']),
      },
      {
        key: 'foxstatues',
        path: foxstatues,
        offset: { x: 0, y: 28 },
        onClick: () =>
          triggerDialogueModal(["There's a pair of fox statues flanking the entrance."]),
      },
    ],
  },
  {
    location: 7,
    background: {
      key: 'bg_room007',
      path: room7,
    },
    music: {
      key: 'm_room007',
      path: room14Music,
    },
    objects: [
      {
        key: 'chair',
        path: chair,
        offset: { x: -40, y: 31.9 },
        onClick: () => triggerDialogueModal(['Looks comfortable.']),
      },
      {
        key: 'cabinet',
        path: cabinet,
        offset: { x: 26, y: 17.4 },
        onClick: () => triggerDialogueModal(['A cabinet.']),
      },
    ],
  },
  {
    location: 8,
    background: {
      key: 'bg_room008',
      path: room8,
    },
    music: {
      key: 'm_room008',
      path: room14Music,
    },
    objects: [],
  },
  {
    location: 9,
    background: {
      key: 'bg_room009',
      path: room9,
    },
    music: {
      key: 'm_room009',
      path: forest,
    },
    objects: [],
  },
  {
    location: 10,
    background: {
      key: 'bg_room010',
      path: room10,
    },
    music: {
      key: 'm_room010',
      path: forest,
    },
    objects: [],
  },
  {
    location: 11,
    background: {
      key: 'bg_room011',
      path: room11,
    },
    music: {
      key: 'm_room011',
      path: room11Music,
    },
    objects: [],
  },
  {
    location: 12,
    background: {
      key: 'bg_room012',
      path: room12,
    },
    music: {
      key: 'm_room012',
      path: room12Music,
    },
    objects: [
      {
        key: 'prayerwheels',
        path: prayerwheels,
        offset: { x: -48.65, y: 13 },
        onClick: () =>
          triggerDialogueModal([
            'This set of prayer wheels will allow $KAMI to be removed from the game world.',
          ]),
      },
      {
        key: 'bellshapeddevice',
        path: bellshapeddevice,
        offset: { x: 39.04, y: -13.92 },
        onClick: () =>
          triggerDialogueModal(['This device will allow Kamigotchi to leave the world as tokens.']),
      },
      {
        key: 'glassbox',
        path: glassbox,
        offset: { x: -9, y: -3.92 },
        onClick: () =>
          triggerDialogueModal(['This device will allow you to view information about balances.']),
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
      key: 'm_room013',
      path: room13Music,
    },
    objects: [
      {
        key: 'cashregister',
        path: cashregister,
        offset: { x: -50.5, y: -8.02 },
        onClick: triggerShopModal,
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
      key: 'm_room014',
      path: room14Music,
    },
    objects: [],
  },
];

export const describeCharacter = {
  bodyType: [
    'Bee',
    'Butterfly',
    'Cube',
    'Default',
    'Drip',
    'Bulb',
    'Octahedron',
    'Eldritch',
    'Orb',
    'Tube',
    'Ghost',
    'Orb',
  ],
  colors: ['Canto Green'],
  handType: ['Orbs', 'Eyeballs', 'Mantis', 'Paws', 'Plugs', 'Scorpion', 'Tentacles', 'Claws'],
  face: ['^-^', 'c_c', ':3', '._.', 'ಠ_ಠ', 'Dotted', 'Squiggle', 'v_v', 'x_x'],
};
