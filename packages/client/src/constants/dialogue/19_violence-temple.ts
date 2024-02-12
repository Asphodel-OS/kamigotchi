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

export default [violenceFloor];
