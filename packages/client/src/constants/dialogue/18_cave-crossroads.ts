import { playBell } from 'utils/sounds';
import { DialogueNode } from '.';

const caveFloor: DialogueNode = {
  index: 181,
  text: ['The floor is squishy here. It makes you uncomfortable.'],
  action: {
    type: 'move',
    label: 'Leave',
    input: 15,
  },
};
const pathLeft: DialogueNode = {
  index: 182,
  text: ['Something shines in the distance.'],
  action: {
    type: 'move',
    label: 'Explore',
    input: 19,
  },
};
const pathRight: DialogueNode = {
  index: 183,
  text: ['This path feels familiar.'],
  action: {
    type: 'move',
    label: 'Explore',
    input: 15,
  },
};

const hangingbell: DialogueNode = {
  index: 184,
  text: [
    'A conical bell cast in dark bronze and decorated with patterns representing sea creatures.',
    'It makes a quiet and hollow tone when struck.',
  ],
  action: {
    type: 'touch',
    label: 'Ring the bell',
    onClick: () => playBell(),
  },
};

export default [caveFloor, pathLeft, pathRight, hangingbell];
