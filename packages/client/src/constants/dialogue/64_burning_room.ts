import { DialogueNode } from '.';

const hut: DialogueNode = {
  index: 641,
  text: [`It's hot in here. Do you want to head back outside?`],
  action: {
    type: 'move',
    label: 'Exit',
    input: 65,
  },
};

export default [hut];
