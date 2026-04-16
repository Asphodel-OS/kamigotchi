import { DialogueNode } from '.';

const planeDoor: DialogueNode = {
  index: 521,
  text: [
    `There's a make-shift structure here that looks like an entrance. It should be possible to enter the airplane...`,
  ],
  action: {
    type: 'move',
    label: 'Enter',
    input: 54,
  },
};

const airplane: DialogueNode = {
  index: 522,
  text: [
    'The airplane seems to have been here for some time. Its holes are patched up with wood and scrap.',
  ],
};

const tailFinSymbol: DialogueNode = {
  index: 523,
  text: ["There's an odd logo on the tail fin. It looks like a man without a head."],
};

const brokenTrees: DialogueNode = {
  index: 524,
  text: ['The crash carved a clearing into the forest. Broken remains of trees litter the ground.'],
};

export default [planeDoor, airplane, tailFinSymbol, brokenTrees];
