import { DialogueNode } from '.';

export const clock: DialogueNode = {
  index: 131,
  text: ['*tik tok*'],
};

export const mina: DialogueNode = {
  index: 132,
  text: ["Mina doesn't want to talk to you. Perhaps her dialogue will be implemented soon."],
};

const exit: DialogueNode = {
  index: 133,
  text: ["There's no exit in sight, but you also don't feel trapped."],
  action: {
    type: 'move',
    label: 'Leave',
    input: 2,
  },
};

export default [clock, mina, exit];
