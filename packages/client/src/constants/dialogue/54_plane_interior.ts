import { DialogueNode } from '.';

const planeDoor: DialogueNode = {
  index: 541,
  text: ['You could go back out the way you came...'],
  action: {
    type: 'move',
    label: 'Exit',
    input: 52,
  },
};

const egg: DialogueNode = {
  index: 542,
  text: ["An egg is nested in this ashtray. It's probably not fit for eating."],
};

const screens: DialogueNode = {
  index: 543,
  text: ['These screens survived the crash without cracks.'],
};

const exoticPelts: DialogueNode = {
  index: 544,
  text: [
    'Exotic pelts have been draped over a few of the seats. Where did these come from?',
  ],
};

const ancientDrawing: DialogueNode = {
  index: 545,
  text: [
    "There's a charcoal drawing on the ceiling. It appears to show five people engaged in a fanatical dance.",
  ],
};

const leatherBoundBook: DialogueNode = {
  index: 546,
  text: ['An old leather-bound tome lies on the table.'],
};

export default [planeDoor, egg, screens, exoticPelts, ancientDrawing, leatherBoundBook];
