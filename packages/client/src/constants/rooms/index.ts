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
import { room15 } from './15';
import { room16 } from './16';
import { room18 } from './18';
import { room19 } from './19';
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
import { room58 } from './58';
import { room59 } from './59';
import { room60 } from './60_scrap-trees';
import { room61 } from './61_decaying-forest-path';
import { room62 } from './62_centipedes';
import { room63 } from './63_deeper-forest-paths';
import { room64 } from './64_burning-room';
import { room65 } from './65_forest-hut';
import { room66 } from './66_trading-room';
import { room67 } from './67';
import { room68 } from './68';
import { room69 } from './69';
import { room70 } from './70';
import { room71 } from './71';
import { room72 } from './72';
import { room73 } from './73';
import { room74 } from './74';
import { room75 } from './75';
import { room76 } from './76';
import { room77 } from './77';
import { room78 } from './78';
import { room79 } from './79';
import { room80 } from './80';
import { room81 } from './81';
import { room82 } from './82';
import { room83 } from './83';
import { room84 } from './84';
import { room85 } from './85';
import { room86 } from './86';
import { room87 } from './87';
import { room88 } from './88';
import { room89 } from './89';
import { room90 } from './90';
import { Room } from './types';

export const PORTAL_ROOM_INDEX = 12;

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
  room15,
  room16,
  { index: 17, backgrounds: [''], objects: [] },
  room18,
  room19,
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
  room58,
  room59,
  room60,
  room61,
  room62,
  room63,
  room64,
  room65,
  room66,
  room67,
  room68,
  room69,
  room70,
  room71,
  room72,
  room73,
  room74,
  room75,
  room76,
  room77,
  room78,
  room79,
  room80,
  room81,
  room82,
  room83,
  room84,
  room85,
  room86,
  room87,
  room88,
  room89,
  room90,
];
