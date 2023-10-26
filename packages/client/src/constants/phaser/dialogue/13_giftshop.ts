import { DialogueNode } from '.';


export const clock: DialogueNode = {
  index: 131,
  text: [
    '*tik tok*',
  ],
};

export const mina: DialogueNode = {
  index: 132,
  text: [
    "Mina doesn't want to talk to you. Perhaps her dialogue will be implemented soon.",
  ],
};

export default [clock, mina];

// export const room13: Room = {
//   location: 13,
//   background: {
//     key: 'bg_room013',
//     path: backgroundMina,
//   },
//   music: {
//     key: 'forest',
//     path: forestOST,
//   },
//   objects: [
//     {
//       key: 'cashregister',
//       path: objectCashRegister,
//       offset: { x: -50.5, y: -8.02 },
//       onClick: () => triggerShopModal(1),
//     },
//   ],
// };