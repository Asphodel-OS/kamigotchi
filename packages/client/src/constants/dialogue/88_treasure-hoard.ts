import { DialogueNode } from '.';

const exit: DialogueNode = {
  index: 881,
  text: [
    'A greatsword in the Carolingian style.',
    'The blade is the size of a man and is polished to a mirror sheen.',
    ' In the reflection, you can see the high-tech ancient facility from whence you came.',
  ],
  action: {
    type: 'move',
    label: 'Leave',
    input: 72,
  },
};

const treasure: DialogueNode = {
  index: 882,
  text: [
    'A pile of treasure.',
    'Mostly gold coins, but also some glass bottles and a few handfuls of sparkling gems.',
    ' The chest sits on a large plinth decorated with carved dragons, monsters, and Gaulish script.',
  ],
};
export default [treasure, exit];
