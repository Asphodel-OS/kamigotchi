import { room00 } from './00_loading';
import { room01 } from './01_mistyriver';
import { room02 } from './02_treetunnel';
import { room03 } from './03_gate';
import { room04 } from './04_junkyard';
import { room05 } from './05_restricted';
import { room06 } from './06_office-front';
import { room07 } from './07_office-lobby';
import { room08 } from './08_junkshop';
import { room09 } from './09_forest';
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
import { room20 } from './20_ancient-riverbed';
import { room21 } from './21_hallway-i';
import { room22 } from './22_flooded-atrium';
import { room23 } from './23_submerged-giant';
import { room24 } from './24_impure-basin';
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
import { room38 } from './38_hallway-ii';
import { room39 } from './39_hallway-iii';
import { room40 } from './40_hallway-iv';
import { room41 } from './41_hallway-v';
import { room43 } from './43_hallway-vii';
import { room44 } from './44_hallway-viii';
import { room45 } from './45_back-exit';
import { room46 } from './46_parking-lot';
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
  room07,
  room08,
  room09,
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
  room20,
  room21,
  room22,
  room23,
  room24,
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
  room38,
  room39,
  room40,
  room41,
  { index: 42, backgrounds: [''], objects: [] },
  room43,
  room44,
  room45,
  room46,
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
];
