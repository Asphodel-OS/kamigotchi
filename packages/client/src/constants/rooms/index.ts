import { room1 } from './1_mistyriver';
import { room2 } from './2_treetunnel';
import { room3 } from './3_gate';
import { room4 } from './4_junkyard';
import { room5 } from './5_restricted';
import { room6 } from './6_office-front';
import { room7 } from './7_office-lobby';
import { room8 } from './8_junkshop';
import { room9 } from './9_forest';
import { room10 } from './10_forest-insect';
import { room11 } from './11_waterfall';
import { room12 } from './12_junkyard-machine';
import { room13 } from './13_giftshop';
import { room14 } from './14_office-ceo';
import { room15 } from './15_temple-cave';
import { room16 } from './16_techno-temple';
import { room17 } from './17_misty-park';
import { room18 } from './18_cave-crossroads';
import { room19 } from './19_violence-temple';

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
  dialogue?: number;
  onClick?: Function; // TODO: wipe this in favor of inputs
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
  [4, 12, 13],
  [15, 16, 18, 19],
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
];
