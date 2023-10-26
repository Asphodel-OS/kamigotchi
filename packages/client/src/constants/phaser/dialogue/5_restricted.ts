import { DialogueNode } from '.';


const trashbag: DialogueNode = {
  index: 51,
  text: [
    'Mushrooms of all shapes and sizes are growing on this hollow stump. Its one remaining branch reaches out in a greeting.',
    'You hear birds chirping inside the thick foliage.',
    'All in all, the forest seems to be in good health.',
  ],
};

const acompanybuilding: DialogueNode = {
  index: 52,
  text: [
    'A tall office - like building with the letter A on it.The sun reflecting on the windows makes it sparkle. Curiously, but not unusually, straight.',
    'That\'s just how buildings are, before you get to know their odds and bends.',
  ],
};

const warningsign: DialogueNode = {
  index: 53,
  text: [
    'This road has been poorly maintained, but the cherry trees around it are thriving and elegantly posed.',
    'The writing on the sign itself doesn\'t make any sense, but red usually means danger.',
  ],
};

export default [trashbag, acompanybuilding, warningsign];