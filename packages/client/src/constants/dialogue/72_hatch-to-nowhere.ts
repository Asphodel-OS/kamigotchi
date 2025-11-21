import { DialogueNode } from '.';

const exit: DialogueNode = {
  index: 721,
  text: [
    'You can access a room above through this tube. Watch your Kami on the sides.\n(Need Aetheric Sextant)',
  ],
  action: {
    type: 'move',
    label: 'Enter',
    input: 88,
  },
};

export default [exit];
