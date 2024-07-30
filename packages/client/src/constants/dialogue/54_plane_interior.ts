import { DialogueNode } from '.';

const planeDoor: DialogueNode = {
  index: 541,
  text: ['You could go back out the way you came...'],
  action: {
    type: 'move',
    label: 'Exit',
    input: 52,
  },
};

export default [planeDoor];
