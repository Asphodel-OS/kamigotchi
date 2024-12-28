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
import dialogues49 from './49_clearing';
import dialogues52 from './52_airplane_crash';
import dialogues54 from './54_plane_interior';
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
  dialogues49,
  dialogues52,
  dialogues54
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
