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
  occultcircle,
  monolith,
  junkmonitors,
  junkvendingwall,
  warningsign,
  beetle1,
  beetle2,
  beetle3,
  smallmushrooms,
  beetle4,
  centipedeandgrub,
  foresttrunk,
  termitemound,
  poster,
  appleimac,
  businesspaperwork,
  smallwaterfall,
  mina,
  emaboard,
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

import { forest } from 'assets/sound/ost';
import { triggerPetMintModal } from 'layers/phaser/utils/triggerPetMintModal';
import { triggerDialogueModal } from 'layers/phaser/utils/triggerDialogueModal';
import { triggerNodeModal } from 'layers/phaser/utils/triggerNodeModal';
import { triggerShopModal } from 'layers/phaser/utils/triggerShopModal';
import { triggerPetNamingModal } from 'layers/phaser/utils/triggerPetNamingModal';

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
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
];

// all our lovely, hardcoded room details
export const rooms: Room[] = [
  { location: 0 },
  {
    location: 1,
    background: {
      key: 'bg_room001',
      path: room1,
    },
    music: {
      key: 'forest',
      path: forest,
    },
    objects: [
      {
        key: 'mooringpost',
        path: mooringpost,
        offset: { x: -19, y: 38 },
        onClick: () =>
          triggerDialogueModal([
            "This looks like a mooring post. There's enough rope attached to secure a boat. Somehow, you know the spot is taken.",
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
      key: 'forest',
      path: forest,
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
            'more',
            'more',
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
      key: 'forest',
      path: forest,
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
      key: 'forest',
      path: forest,
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
      key: 'forest',
      path: forest,
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
      {
        key: 'warningsign',
        path: warningsign,
        offset: { x: 10.5, y: 39.6 },
        onClick: () => triggerDialogueModal(['Stay out.']),
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
      key: 'forest',
      path: forest,
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
      key: 'forest',
      path: forest,
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
      key: 'forest',
      path: forest,
    },
    objects: [
      {
        key: 'junkmonitors',
        path: junkmonitors,
        offset: { x: 54, y: 17 },
        onClick: () => triggerDialogueModal(['Junk monitors.']),
      },
      {
        key: 'junkvendingwall',
        path: junkvendingwall,
        offset: { x: -47.5, y: -4.5 },
        onClick: () => triggerDialogueModal(['A wall that vends junk.']),
      },
      {
        key: 'poster',
        path: poster,
        offset: { x: 35.5, y: -1.4 },
        onClick: () => triggerDialogueModal(['A poster of no particular importance.']),
      },
    ],
  },
  {
    location: 9,
    background: {
      key: 'bg_room009',
      path: room9,
    },
    music: {
      key: 'forest',
      path: forest,
    },
    objects: [
      {
        key: 'beetle1',
        path: beetle1,
        offset: { x: 53.5, y: -53.35 },
        onClick: () => triggerDialogueModal(['Beetle one.']),
      },
      {
        key: 'beetle2',
        path: beetle2,
        offset: { x: 11.5, y: -7 },
        onClick: () => triggerDialogueModal(['Beetle two.']),
      },
      {
        key: 'beetle3',
        path: beetle3,
        offset: { x: -59.5, y: -15.5 },
        onClick: () => triggerDialogueModal(['Beetle three.']),
      },
      {
        key: 'smallmushrooms',
        path: smallmushrooms,
        offset: { x: -52, y: 58 },
        onClick: () => triggerDialogueModal(['Small mushrooms.']),
      },
    ],
  },
  {
    location: 10,
    background: {
      key: 'bg_room010',
      path: room10,
    },
    music: {
      key: 'forest',
      path: forest,
    },
    objects: [
      {
        key: 'beetle4',
        path: beetle4,
        offset: { x: -42.55, y: 38.6 },
        onClick: () => triggerDialogueModal(['Beetle four.']),
      },
      {
        key: 'centipedeandgrub',
        path: centipedeandgrub,
        offset: { x: 41.6, y: 52.5 },
        onClick: () => triggerDialogueModal(['A centipede and a grub.']),
      },
      {
        key: 'foresttrunk',
        path: foresttrunk,
        offset: { x: -53, y: -7 },
        onClick: () => triggerDialogueModal(['A hollow tree-trunk.']),
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
      key: 'forest',
      path: forest,
    },
    objects: [
      {
        key: 'emaboard',
        path: emaboard,
        offset: { x: 45.5, y: 31 },
        onClick: triggerPetNamingModal,
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
      key: 'forest',
      path: forest,
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
        onClick: () => triggerDialogueModal(['An apple Imac.']),
      },
      {
        key: 'businesspaperwork',
        path: businesspaperwork,
        offset: { x: 7, y: 3.6 },
        onClick: () => triggerDialogueModal(['A pile of documents.']),
      },
      {
        key: 'smallwaterfall',
        path: smallwaterfall,
        offset: { x: -53.9, y: 5.6 },
        onClick: () => triggerDialogueModal(['A waterfall in the distance.']),
      },
    ],
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
