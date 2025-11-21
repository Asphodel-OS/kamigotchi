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

const openhatch: DialogueNode = {
  index: 722,
  text: [
    'The open hatch looks like it would be highly secure if it were closed',
    'Inside is only a small, empty cave room',
    'If something were ever kept inside, it’s gone now',
  ],
};

const shatteredtube: DialogueNode = {
  index: 723,
  text: ['You can access a room above through this tube', 'Watch your Kami on the sides'],
};
const damageddevice: DialogueNode = {
  index: 724,
  text: [
    'The top panel has an array of buttons with unrecognizable symbols and a display screen',
    'Like everything else in this facility, there’s no power',
    'The front panel of this device is open, and it looks like an important part has been removed',
  ],
};
export default [damageddevice, openhatch, shatteredtube, exit];
