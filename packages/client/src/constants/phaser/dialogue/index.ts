import { DialogueNode } from './types';
import dialogues01 from './1_mistyriver';
import dialogues02 from './2_treetunnel';
import dialogues03 from './3_gate';
import dialogues04 from './4_junkyard';
import dialogues05 from './5_restricted';
import dialogues06 from './6_office-front';
import dialogues07 from './7_office-lobby';
import dialogues08 from './8_junkshop';
import dialogues09 from './9_forest';
import dialogues10 from './10_forest-insect';
import dialogues11 from './11_waterfall';
import dialogues12 from './12_junkyard-machine';
import dialogues13 from './13_giftshop';
import dialogues14 from './14_office-ceo';

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
);

// aggregated map of all dialogue nodes, referenced by index
export const dialogues = dialogueList.reduce(function (map, node: DialogueNode) {
  map[node.index] = node;
  return map;
}, {} as { [key: number]: DialogueNode });

export type { DialogueNode } from './types';