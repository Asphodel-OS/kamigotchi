import {
  vendingmachine,
  mooringpost,
  toriigate,
  hollowstump,
  gate,
  shopdoor,
  cashregister
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
  room2Music,
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
  exits: RoomExits;
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

// represents the directional exist from a room
interface RoomExits {
  up?: number;
  down?: number;
  left?: number;
  right?: number;
}

// represents the music in a room
interface RoomMusic {
  key: string;
  path: string;
}

// all our lovely, hardcoded room details
export const rooms: Room[] = [
  {
    location: 0,
    exits: {},
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
    exits: { up: 2 },
    background: {
      key: 'bg_room001',
      path: room1,
    },
    music: {
      key: 'm_room001',
      path: room1Music,
    },
    objects: [  {
        key: 'mooringpost',
        path: mooringpost,
        offset: { x: -19, y: 38 },
        onClick: (text) => triggerDialogueModal("This looks like a post for mooring boats. But there's no boats here.")
      }
    ],
  },
  {
    location: 2,
    exits: { up: 3, down: 1, left: 13 },
    background: {
      key: 'bg_room002',
      path: room2,
    },
    music: {
      key: 'm_room002',
      path: room2Music,
    },
    objects: [  {
        key: 'hollowstump',
        path: hollowstump,
        offset: { x: -48.5, y: 29.5 },
        onClick: (text) => triggerDialogueModal("It's a hollow tree stump. There doesn't appear to be anything inside.")
      },
      {
          key: 'gate',
          path: gate,
          offset: { x: -39.5, y: -33.5 },
          onClick: (text) => triggerDialogueModal("There's some sort of gate in the distance.")
      },
      {
          key: 'shopdoor',
          path: shopdoor,
          offset: { x: 5, y: -7 },
          onClick: (text) => triggerDialogueModal("Wow. A shop. Maybe you can buy food here. Go west to enter.")
      }
    ],
  },
  {
    location: 3,
    exits: { up: 4, down: 2 },
    background: {
      key: 'bg_room003',
      path: room3,
    },
    music: {
      key: 'm_room003',
      path: room3Music,
    },
    objects: [  {
        key: 'toriigate',
        path: toriigate,
        offset: { x: 21, y: -8 },
        onClick: triggerNodeModal
      }],
  },
  {
    location: 4,
    exits: { up: 5, down: 3, left: 12 },
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
        onClick: triggerPetMintModal
      }
    ],
  },
  {
    location: 5,
    exits: { up: 6, down: 4, left: 9 },
    background: {
      key: 'bg_room005',
      path: room5,
    },
    music: {
      key: 'm_room005',
      path: room5Music,
    },
    objects: [],
  },
  {
    location: 6,
    exits: { up: 7, down: 5 },
    background: {
      key: 'bg_room006',
      path: room6,
    },
    music: {
      key: 'm_room006',
      path: room6Music,
    },
    objects: [],
  },
  {
    location: 7,
    exits: { down: 6, left: 8, right: 14 },
    background: {
      key: 'bg_room007',
      path: room7,
    },
    music: {
      key: 'm_room007',
      path: room7Music,
    },
    objects: [],
  },
  {
    location: 8,
    exits: { right: 7 },
    background: {
      key: 'bg_room008',
      path: room8,
    },
    music: {
      key: 'm_room008',
      path: room8Music,
    },
    objects: [],
  },
  {
    location: 9,
    exits: { up: 11, down: 10, right: 5 },
    background: {
      key: 'bg_room009',
      path: room9,
    },
    music: {
      key: 'm_room009',
      path: room9Music,
    },
    objects: [],
  },
  {
    location: 10,
    exits: { up: 9 },
    background: {
      key: 'bg_room010',
      path: room10,
    },
    music: {
      key: 'm_room010',
      path: room10Music,
    },
    objects: [],
  },
  {
    location: 11,
    exits: { down: 9 },
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
    exits: { right: 4 },
    background: {
      key: 'bg_room012',
      path: room12,
    },
    music: {
      key: 'm_room012',
      path: room12Music,
    },
    objects: [],
  },
  {
    location: 13,
    exits: { right: 2 },
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
          onClick: triggerShopModal
      }
    ],
  },
  {
    location: 14,
    exits: { left: 7 },
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

interface RoomInfo {
  room: number;
}
type GridRooms = { [key: string]: RoomInfo };

export const gridRooms: GridRooms = {
  '1': { room: 14 },
  '2': { room: 13 },
  '7': { room: 12 },
  '6': { room: 11 },
  '3': { room: 10 },
  '13': { room: 9 },
  '14': { room: 8 },
  '15': { room: 7 },
  '26': { room: 6 },
  '27': { room: 5 },
  '37': { room: 4 },
  '38': { room: 3 },
  '39': { room: 2 },
  '40': { room: 1 },
};

export const describeCharacther = {
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
  handType: [
    'Orbs',
    'Eyeballs',
    'Mantis',
    'Paws',
    'Plugs',
    'Scorpion',
    'Tentacles',
    'Claws',
  ],
  face: ['^-^', 'c_c', ':3', '._.', 'ಠ_ಠ', 'Dotted', 'Squiggle', 'v_v', 'x_x'],
};
