import { triggerTempleOfTheWheelModal } from 'app/triggers';
import { dimiBoth } from 'assets/images/rooms/19_temple-of-the-wheel';
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

export const Dimidiatus: DialogueNode = {
  index: 193,
  text: [
    `Hail, curious one.`,
    `We are Dimidiatus. The threads of fate have bound us together.`,
    `No one is using this old temple, so we set up shop.`,
    `We're happy to serve. `,
    `What service? You'll have to ask the other guy. Heh heh.`,
  ],
  npc: {
    name: 'Dimidiatus',
    img: dimiBoth,
    color: '#d4a017',
    special: {
      name: 'Kami Sacrifice',
      onclick: () => {
        triggerTempleOfTheWheelModal();
      },
    },
  },
};

const sacrificeComplete: DialogueNode = {
  index: 194,
  text: [
    ` We accept the          We accept the
 chosen offering.     chosen offering.
 Let it be done.         Let it be done.`,
  ],
  npc: {
    name: 'Dimidiatus',
    img: dimiBoth,
    color: '#d4a017',
  },
};

export default [violenceFloor, blackPool, Dimidiatus, sacrificeComplete];
