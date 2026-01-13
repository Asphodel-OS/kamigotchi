import { DialogueNode } from '.';

const tradingPanel: DialogueNode = {
  index: 661,
  text: [`The screen is now dancing with life. \nThe marketplace is open.`],
  action: {
    type: 'trading',
    label: 'Trade',
  },
};

const marketplaceTree: DialogueNode = {
  index: 662,
  text: [
    'This machine hums with energy. The power cords appear to be plugged directly into the ground.',
  ],
};

export default [tradingPanel, marketplaceTree];
