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

export default [stonelantern, smallshrine];

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
//     {
//       key: 'waterfall',
//       path: objectWaterfall,
//       offset: { x: 22.6, y: -33.5 },
//       onClick: () => triggerRoomMovementModal(15),
//     },
//   ],
// };