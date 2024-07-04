import { DialogueNode } from '.';

export const clock: DialogueNode = {
  index: 131,
  text: ['*tik tok*'],
};

export const mina: DialogueNode = {
  index: 132,
  text: [
    `You're early..... I'm still just setting up the shop.`,
    `Interact with the cash register if you want to trade. And I have some tasks for you, if you're free....`,
  ],
};

const exit: DialogueNode = {
  index: 133,
  text: ['Do you want to leave this.... place?'],
  action: {
    type: 'move',
    label: 'Leave',
    input: 2,
  },
};

export default [clock, mina, exit];
