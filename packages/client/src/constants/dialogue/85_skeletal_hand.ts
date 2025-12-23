import { DialogueNode } from './types';

const hand: DialogueNode = {
  index: 851,
  text: [
    'The bones of a titanic hand block the passageway.',
    'The tips of its fingers stand taller than most people.\n(Titanic Offering Coop must be completed)',
  ],
  action: {
    type: 'move',
    label: 'Explore',
    input: 86,
  },
};

export default [hand];
