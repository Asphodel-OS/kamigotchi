import { DialogueNode } from '.';

const hollowStump: DialogueNode = {
  index: 21,
  text: [
    'Mushrooms of all shapes and sizes are growing on this hollow stump. Its one remaining branch reaches out in a greeting.',
    'You hear birds chirping inside the thick foliage.',
    'All in all, the forest seems to be in good health.',
  ],
};

const gate: DialogueNode = {
  index: 22,
  text: [
    'Through the opening, you can see the sun shining down on a large gate. A good place to catch your breath, perhaps.',
  ],
  action: {
    type: 'move',
    label: 'Explore',
    input: 3,
  },
};

const shopDoor: DialogueNode = {
  index: 23,
  text: ["There's some sort of door hanging here in mid-air. The sign above it says 'Shop'."],
  action: {
    type: 'move',
    label: 'Enter',
    input: 13,
  },
};

export default [hollowStump, gate, shopDoor];
