import { DialogueNode } from '.';


const caveFloor: DialogueNode = {
  index: 181,
  text: [
    "The floor is squishy here. It makes you uncomfortable.",
  ],
  action: {
    type: 'move',
    label: 'Leave',
    input: 15,
  },
};
const pathLeft: DialogueNode = {
  index: 182,
  text: [
    "Something shines in the distance.",
  ],
  action: {
    type: 'move',
    label: 'Explore',
    input: 19,
  },
};
const pathRight: DialogueNode = {
  index: 183,
  text: [
    "This path feels familiar.",
  ],
  action: {
    type: 'move',
    label: 'Explore',
    input: 15,
  },
};

export default [caveFloor, pathLeft, pathRight];