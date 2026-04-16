import { DialogueNode } from '.';
import { getNpcDialogueByIndex } from './npcsCsvHandler';

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
  action: [
    undefined, // no buttons on step 0
    [
      { type: 'goal', label: 'Co-op', input: 13 },
      { type: 'move', label: 'Enter', input: 59 },
    ],
  ],
};

export const Dimidiatus: DialogueNode = getNpcDialogueByIndex(20001);

const sacrificeComplete: DialogueNode = getNpcDialogueByIndex(20011);

export default [violenceFloor, blackPool, Dimidiatus, sacrificeComplete];
