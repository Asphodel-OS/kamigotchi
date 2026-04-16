import { DialogueNode } from '.';
import { getNpcDialogueByIndex } from './npcsCsvHandler';

export const clock: DialogueNode = {
  index: 131,
  text: ['*tik tok*'],
};

export const mina: DialogueNode = getNpcDialogueByIndex(10001);

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
