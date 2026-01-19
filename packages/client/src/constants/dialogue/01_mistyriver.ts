import { DialogueNode } from '.';

const mooringPost: DialogueNode = {
  index: 11,
  text: [
    "You see what looks like a mooring post with rope attached to it. You don't remember a boat, but how else would you have gotten here?",
  ],
};

const river: DialogueNode = {
  index: 12,
  text: ['Dark water flows in a gentle current.'],
};

export default [mooringPost, river];
