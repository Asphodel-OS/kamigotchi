import { DialogueNode } from '.';

const technofloor: DialogueNode = {
  index: 161,
  text: ['The floor here is made of some kind of metal.', 'It seems to be a dead end.'],
  action: {
    type: 'move',
    label: 'Go Back',
    input: 15,
  },
};

const offeringbox: DialogueNode = {
  index: 162,
  text: [
    'The offering box has been repurposed into a housing for some complex hardware.',
    `There's a slot where you could insert something.`,
  ],
};

const crtmonitor: DialogueNode = {
  index: 163,
  text: [
    'The wires powering this monitor seem to plug right into the stone walls.',
    'No matter what buttons you press, it only displays static.',
  ],
};
export default [technofloor, offeringbox, crtmonitor];
