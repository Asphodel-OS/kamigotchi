import { DialogueNode } from '.';


const hollowStump: DialogueNode = {
  index: 21,
  text: [
    "Mushrooms of all shapes and sizes are growing on this hollow stump. Its one remaining branch reaches out in a greeting.",
    "You hear birds chirping inside the thick foliage.",
    "All in all, the forest seems to be in good health.",
  ],
};

const gate: DialogueNode = {
  index: 22,
  text: [
    "Through the opening, you can see the sun shining down on a large gate. A good place to catch your breath, perhaps.",
  ],
  action: {
    type: 'move',
    label: 'Explore',
    input: 3,
  },
};

const shopDoor: DialogueNode = {
  index: 23,
  text: [
    "An otherworldy door is suspended in mid - air! There's a hair - raising energy emanating from it....",
    "You look around for the shop it should be attached to. It looks mostly the same from the other side, except for the sign says \"POHS\".",
    "No telling where you'll end up if you go through.... but it feels safest to enter from the front.",
  ],
  action: {
    type: 'move',
    label: 'Enter',
    input: 13,
  },
};

export default [hollowStump, gate, shopDoor];