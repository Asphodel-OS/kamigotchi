import dialogue01 from './1_mistyriver';
import dialogue02 from './2_treetunnel';
import dialogue03 from './3_gate';
import dialogue04 from './4_junkyard';
import dialogue05 from './5_restricted';
import dialogue06 from './6_office-front';
import dialogue07 from './7_office-lobby';
import dialogue08 from './8_junkshop';
import dialogue09 from './9_forest';
import dialogue10 from './10_forest-insect';
import dialogue11 from './11_waterfall';
import dialogue12 from './12_junkyard-machine';
import dialogue13 from './13_giftshop';
import dialogue14 from './14_office-ceo';

export interface DialogueNode {
  index: number;
  text: string[];
  actions?: Map<string, Function>;
  next?: Map<string, number>; // points to more dialogue nodes
};

const dialogue00: DialogueNode[] = [
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
const dialogueList = dialogue00.concat(
  dialogue01,
  dialogue02,
  dialogue03,
  dialogue04,
  dialogue05,
  dialogue06,
  dialogue07,
  dialogue08,
  dialogue09,
  dialogue10,
  dialogue11,
  dialogue12,
  dialogue13,
  dialogue14,
);

// aggregated map of all dialogue nodes, referenced by index
export const dialogueMap = dialogueList.reduce(function (map, node: DialogueNode) {
  map[node.index] = node;
  return map;
}, {} as { [key: number]: DialogueNode });