import dialogues01 from './01_mistyriver';
import dialogues02 from './02_treetunnel';
import dialogues03 from './03_gate';
import dialogues04 from './04_junkyard';
import dialogues05 from './05_restricted';
import dialogues06 from './06_office-front';
import dialogues07 from './07_office-lobby';
import dialogues08 from './08_junkshop';
import dialogues09 from './09_forest';
import dialogues10 from './10_forest-insect';
import dialogues11 from './11_waterfall';
import dialogues12 from './12_junkyard-machine';
import dialogues13 from './13_giftshop';
import dialogues14 from './14_office-ceo';
import dialogues15 from './15_temple-cave';
import dialogues16 from './16_techno-temple';
import dialogues18 from './18_cave-crossroads';
import dialogues19 from './19_violence-temple';
import dialogues25 from './25_lost-skeleton';
import dialogues49 from './49_clearing';
import dialogues52 from './52_airplane_crash';
import dialogues54 from './54_plane_interior';
import dialogues59 from './59_black-pool';
import dialogues60 from './60_scrap-trees';
import dialogues64 from './64_burning_room';
import dialogues65 from './65_forest_hut';
import dialogues66 from './66_trading-room';
import dialogues68 from './68_slippery-pit';
import dialogues69 from './69_lotus-pool';
import dialogues70 from './70_still-stream';
import dialogues71 from './71_shabby-deck';
import dialogues72 from './72_hatch-to-nowhere';
import dialogues73 from './73_broken-tube';
import dialogues74 from './74_engraved-door';
import dialogues75 from './75_flood-mural';
import dialogues76 from './76_fungus-garden';
import dialogues77 from './77_thriving-mushrooms';
import dialogues78 from './78_toadstool-platforms';
import dialogues79 from './79_abandoned-campsite';
import dialogues80 from './80_radiant-crystal';
import dialogues81 from './81_flower-mural';
import dialogues82 from './82_geometric-cliffs';
import dialogues83 from './83_canyon-bridge';
import dialogues84 from './84_reinforced-tunnel';
import dialogues86 from './86_guardian-skull';
import dialogues87 from './87_sacrarium';
import dialogues88 from './88_treasure-hoard';
import dialogues89 from './89_trophies-of-the-hunt';
import dialogues90 from './90_scenic-view';

import { DialogueNode } from './types';

const dialogues00: DialogueNode[] = [
  {
    index: 0,
    text: [
      'There seems to be a gap in dialogue here..',
      'Seriously.. this needs to be fixed.',
      'Might be worth talking to an admin about this.',
    ],
  },
];

// aggregated array of all dialogue nodes
const dialogueList = dialogues00.concat(
  dialogues01,
  dialogues02,
  dialogues03,
  dialogues04,
  dialogues05,
  dialogues06,
  dialogues07,
  dialogues08,
  dialogues09,
  dialogues10,
  dialogues11,
  dialogues12,
  dialogues13,
  dialogues14,
  dialogues15,
  dialogues16,
  dialogues18,
  dialogues19,
  dialogues25,
  dialogues49,
  dialogues52,
  dialogues54,
  dialogues59,
  dialogues60,
  dialogues64,
  dialogues65,
  dialogues66,
  dialogues72,
  dialogues88,
  dialogues68,
  dialogues69,
  dialogues70,
  dialogues71,
  dialogues72,
  dialogues73,
  dialogues74,
  dialogues75,
  dialogues76,
  dialogues77,
  dialogues78,
  dialogues79,
  dialogues80,
  dialogues81,
  dialogues82,
  dialogues83,
  dialogues84,
  dialogues86,
  dialogues87,
  dialogues88,
  dialogues89,
  dialogues90
);

// aggregated map of all dialogue nodes, referenced by index
export const dialogues = dialogueList.reduce(
  function (map, node: DialogueNode) {
    map[node.index] = node;
    return map;
  },
  {} as { [key: number]: DialogueNode }
);

export type { DialogueNode } from './types';
