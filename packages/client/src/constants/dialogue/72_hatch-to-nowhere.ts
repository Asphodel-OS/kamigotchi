import { DialogueNode } from '.';

const exit: DialogueNode = {
  index: 721,
  text: [
    'The hatch would be highly secure if it were closed.',
    'Beyond the threshold is only a small, empty cave room.',
    'What’s the purpose of a door to nowhere?',
  ],
  action: {
    type: 'move',
    label: 'Enter',
    input: 88,
  },
};

const damageddevice: DialogueNode = {
  index: 722,
  text: [
    'The top panel has an array of buttons with unrecognizable symbols and a display screen.',
    `Like everything else in this facility, there's no power.`,
    'The front panel of this device is open, and it looks like an important part has been removed.',
  ],
};

const shatteredtube: DialogueNode = {
  index: 723,
  text: ['You can access a room above through this tube.', 'Watch your Kami on the sides.'],
};

export default [damageddevice, shatteredtube, exit];
