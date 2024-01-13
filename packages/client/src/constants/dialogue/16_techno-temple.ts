import { DialogueNode } from '.';


const technofloor: DialogueNode = {
  index: 161,
  text: [
    "The floor here is made of some kind of metal.",
    "It seems to be a dead end.",
  ],
  action: {
    type: 'move',
    label: 'Go Back',
    input: 15,
  },
};

export default [technofloor];