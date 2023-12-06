import { DialogueNode } from '.';


const stonelantern: DialogueNode = {
  index: 111,
  text: [
    "A stone lantern. Very roughly carved.",
  ],
};

const smallshrine: DialogueNode = {
  index: 112,
  text: [
    'A small shrine. This almost has the energy of a Node, but something is off...',
  ],
};

const waterfall: DialogueNode = {
  index: 113,
  text: [
    'The currents in the pond are twisting themselves into a knot.',
    'The water turns thick and still like in an abandoned aquarium, covered in slime and layers of rotten plant matter.',
    'Decaying, throbbing algae and seaweed reach out from the bottom, and a melodic howling echoes from behind.',
    'Would you like to explore beyond?'
  ],
  action: {
    type: 'move',
    label: 'Explore',
    input: 15,
  },
};

export default [stonelantern, smallshrine, waterfall];

// export const room11: Room = {
//   location: 11,
//   background: {
//     key: 'bg_room011',
//     path: backgroundDefault,
//   },
//   music: {
//     key: 'glitter',
//     path: glitter,
//   },
//   objects: [
//     {
//       key: 'emaboard',
//       path: objectEmaBoard,
//       offset: { x: 45.5, y: 31 },
//       onClick: triggerPetNamingModal,
//     },
// };