import { DialogueNode } from '.';

const exit: DialogueNode = {
  index: 721,
  text: [
    'The open hatch looks like it would be highly secure if it were closed. Beyond is only a small, empty cave room. What’s the purpose of a door to nowhere?\n(Need Aetheric Sextant)',
  ],
  action: {
    type: 'move',
    label: 'Enter',
    input: 88,
  },
};

export default [exit];
