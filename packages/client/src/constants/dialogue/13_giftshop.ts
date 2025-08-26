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
  text: [LoyaltyText, `Welcome to the gift shop.`],
  npc: {
    name: 'Mina',
    background: `   
    background-image: radial-gradient(rgb(255 242 255) 20%, transparent 0), 
                      radial-gradient(rgb(255 242 255) 20%, transparent 0),
                      linear-gradient(to right, white 40%,rgb(255 242 255)); 
  
    background-size: 30px 30px, 
                     30px 30px,
                     100% 100%; 
  
    background-position: 0 0, 15px 15px;
 `,
  },
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
