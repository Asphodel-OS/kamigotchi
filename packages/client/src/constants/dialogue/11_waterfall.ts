import { DialogueNode } from '.';

const stonelantern: DialogueNode = {
  index: 111,
  text: ['A stone lantern. Very roughly carved.'],
};

const smallshrine: DialogueNode = {
  index: 112,
  text: ['A small shrine. This almost has the energy of a Node, but something is off...'],
};

const waterfall: DialogueNode = {
  index: 113,
  text: [
    'Water pours down from a great height, but the pool is shallower than expected.',
    'Where could the water be going? Maybe we should explore further.',
  ],
  action: {
    type: 'move',
    label: 'Explore',
    input: 15,
  },
};

export default [stonelantern, smallshrine, waterfall];

// export const room11: Room = {
//   roomIndex: 11,
//   background: {
//     key: 'bg_room011',
//     path: backgroundDefault,
//   },//
//   objects: [
//     {
//       key: 'emaboard',
//       path: objectEmaBoard,
//       offset: { x: 45.5, y: 31 },
//       onClick: triggerPetNamingModal,
//     },
// };
