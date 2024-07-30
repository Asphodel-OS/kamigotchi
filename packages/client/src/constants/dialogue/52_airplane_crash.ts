import { DialogueNode } from '.';

const planeDoor: DialogueNode = {
  index: 521,
  text: [
    'There’s a make-shift structure here that looks like an entrance. It should be possible to enter the airplane...',
  ],
  action: {
    type: 'move',
    label: 'Enter',
    input: 54,
  },
};

export default [planeDoor];
