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

export default [exit];
