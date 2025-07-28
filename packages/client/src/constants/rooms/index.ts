import { room00 } from './00_loading';
import { room01 } from './01_mistyriver';
import { room02 } from './02_treetunnel';
import { room03 } from './03_gate';
import { room04 } from './04_junkyard';
import { room05 } from './05_restricted';
import { room06 } from './06_office-front';
import { room09 } from './09_forest';
import { room10 } from './10_forest-insect';
import { room11 } from './11_waterfall';
import { room12 } from './12_junkyard-machine';
import { room13 } from './13_giftshop';
import { room25 } from './25_lost-skeleton';
import { room26 } from './26_trash-strewn-graves';
import { room27 } from './27_guardhouse';
import { room28 } from './28_lobby';
import { room29 } from './29_road-out-of-woods';
import { room30 } from './30_scrapyard-entrance';
import { room31 } from './31_scrapyard-exit';
import { room32 } from './32_road-to-labs';
import { room33 } from './33_forest-entrance';
import { room34 } from './34_deeper-into-scrap';
import { room35 } from './35_forest-road-i';
import { room36 } from './36_forest-road-ii';
import { room37 } from './37_forest-road-iii';
import { room47 } from './47_scrap-paths';
import { room48 } from './48_forest-road-iv';
import { room49 } from './49_clearing';
import { room50 } from './50_ancient-forest-entrance';
import { room51 } from './51_scrap-littered-undergrowth';
import { room52 } from './52_airplane-crash';
import { room53 } from './53_blooming-tree';
import { room54 } from './54_plane-interior';
import { room55 } from './55_shady-path';
import { room56 } from './56_butterfly-forest';
import { room57 } from './57_river-crossing';
import { room60 } from './60_scrap-trees';
import { room61 } from './61_decaying-forest-path';
import { room62 } from './62_centipedes';
import { room63 } from './63_deeper-forest-paths';
import { room64 } from './64_burning-room';
import { room65 } from './65_forest-hut';
import { room66 } from './66_trading-room';
import { Room } from './types';

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
  room00,
  room01,
  room02,
  room03,
  room04,
  room05,
  room06,
  { index: 7, backgrounds: [''], objects: [] },
  { index: 8, backgrounds: [''], objects: [] },
  room09,
  room10,
  room11,
  room12,
  room13,
  { index: 14, backgrounds: [''], objects: [] },
  { index: 15, backgrounds: [''], objects: [] },
  { index: 16, backgrounds: [''], objects: [] },
  { index: 17, backgrounds: [''], objects: [] },
  { index: 18, backgrounds: [''], objects: [] },
  { index: 19, backgrounds: [''], objects: [] },
  { index: 20, backgrounds: [''], objects: [] },
  { index: 21, backgrounds: [''], objects: [] },
  { index: 22, backgrounds: [''], objects: [] },
  { index: 23, backgrounds: [''], objects: [] },
  { index: 24, backgrounds: [''], objects: [] },
  room25,
  room26,
  room27,
  room28,
  room29,
  room30,
  room31,
  room32,
  room33,
  room34,
  room35,
  room36,
  room37,
  { index: 38, backgrounds: [''], objects: [] },
  { index: 39, backgrounds: [''], objects: [] },
  { index: 40, backgrounds: [''], objects: [] },
  { index: 41, backgrounds: [''], objects: [] },
  { index: 42, backgrounds: [''], objects: [] },
  { index: 43, backgrounds: [''], objects: [] },
  { index: 44, backgrounds: [''], objects: [] },
  { index: 45, backgrounds: [''], objects: [] },
  { index: 46, backgrounds: [''], objects: [] },
  room47,
  room48,
  room49,
  room50,
  room51,
  room52,
  room53,
  room54,
  room55,
  room56,
  room57,
  { index: 58, backgrounds: [''], objects: [] },
  { index: 59, backgrounds: [''], objects: [] },
  room60,
  room61,
  room62,
  room63,
  room64,
  room65,
  room66,
];
