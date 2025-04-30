import { DialogueNode } from '.';

const hut: DialogueNode = {
  index: 651,
  text: [
    `There's a fire burning inside the hut..... perhaps this would be a good place to burn your VIPP. Do you want to go inside?`,
  ],
  action: {
    type: 'move',
    label: 'Enter',
    input: 64,
  },
};

export default [hut];
