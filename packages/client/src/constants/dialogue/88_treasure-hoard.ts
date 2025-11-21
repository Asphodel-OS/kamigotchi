import { DialogueNode } from '.';

const exit: DialogueNode = {
  index: 881,
  text: [
    'A greatsword in the Carolingian style. The blade is the size of a man and is polished to a mirror sheen. In the reflection, you can see the high-tech facility you just came from.',
  ],
  action: {
    type: 'move',
    label: 'Leave',
    input: 72,
  },
};

const mirroredsword: DialogueNode = {
  index: 882,
  text: [
    'A greatsword in the Carolingian style',
    'The blade is the size of a man and is polished to a mirror sheen',
  ],
};

const treasure: DialogueNode = {
  index: 883,
  text: [
    'Mostly gold coins, but also some glass bottles and a few handfuls of sparkling gems',
    'The chest sits on a large sloped plinth decorated with carved dragons, monsters, and Gaulish script',
  ],
};
export default [treasure, mirroredsword, exit];
