import { DialogueNode } from '.';

export const appleimac: DialogueNode = {
  index: 141,
  text: [
    "An apple iMac. Looks like the G3, actually. There's no power cable, so it's dead.",
  ],
};

export const businesspaperwork: DialogueNode = {
  index: 142,
  text: ['A pile of documents. The writing is unreadable scrawl.'],
};

export const smallwaterfall: DialogueNode = {
  index: 143,
  text: ['A waterfall in the distance.'],
};

export default [appleimac, businesspaperwork, smallwaterfall];

// export const sallwaterfall: Room = {
//   location: 14,
//   background: {
//     key: 'bg_room014',
//     path: backgroundDefault,
//   },
//   music: {
//     key: 'ost3',
//     path: ost3,
//   },
//   objects: [
//     {
//       key: 'occultcircle',
//       path: objectOccultCircle,
//       offset: { x: 37, y: 40 },
//       onClick: () => triggerNodeModal(4),
//     },
//   ],
// };
