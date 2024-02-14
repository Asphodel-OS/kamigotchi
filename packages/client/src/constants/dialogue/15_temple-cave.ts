import { DialogueNode } from '.';

const templegrass: DialogueNode = {
  index: 151,
  text: [
    'The grass is overgrown here. A heavy energy hangs in the air.',
    'It might not be safe. Should we go back?',
  ],
  action: {
    type: 'move',
    label: 'Leave',
    input: 11,
  },
};

const templedoor: DialogueNode = {
  index: 152,
  text: [
    "These markings don't look like the work of tools.",
    "It's almost as if they were carved at by small, sharp teeth.",
  ],
  action: {
    type: 'move',
    label: 'Enter',
    input: 16,
  },
};

const templecave: DialogueNode = {
  index: 153,
  text: ['The cave ahead looks dark and damp.', 'The air is heavy with the smell of rot.'],
  action: {
    type: 'move',
    label: 'Explore',
    input: 18,
  },
};

export default [templegrass, templedoor, templecave];
