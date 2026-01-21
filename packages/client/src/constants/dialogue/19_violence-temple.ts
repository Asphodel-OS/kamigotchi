import { DialogueNode } from '.';

const violenceFloor: DialogueNode = {
  index: 191,
  text: [
    "A strange ringing. It's almost as if the room is vibrating.",
    "But you don't Hear it. You Feel it.",
  ],
  action: {
    type: 'move',
    label: 'What',
    input: 18,
  },
};

const blackPool: DialogueNode = {
  index: 192,
  text: [
    'This pool of black ooze rests at the exact center of the circular temple.',
    'You could see it as a spoke within a greater wheel.',
  ],
};

export default [violenceFloor, blackPool];
