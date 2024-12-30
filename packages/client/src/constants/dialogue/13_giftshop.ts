import { DialogueNode } from '.';

const LoyaltyText = (loyalty: number) => {
  if (loyalty < 5)
    return `I'm sorry, I don't know you. Please stop bothering me, and take a shower.`;
  else if (loyalty < 10) return `Welcome back! Good to see you again.`;
  else return `My favorite customer! You've been a good boy, haven't you?`;
};

export const clock: DialogueNode = {
  index: 131,
  text: ['*tik tok*'],
};

export const mina: DialogueNode = {
  index: 132,
  text: [LoyaltyText, `I need your help. Interested in supporting new product development?`],
  npc: 'Mina',
  action: {
    type: 'goal',
    label: 'Support Mina',
    input: 5,
  },
  args: [
    {
      type: 'REPUTATION',
      index: 2,
    },
  ],
};

const exit: DialogueNode = {
  index: 133,
  text: ['Do you want to leave this.... place?'],
  action: [
    {
      type: 'move',
      label: 'Leave',
      input: 2,
    },
  ],
};

export default [clock, mina, exit];
