import { DialogueNode } from '.';

const tradingPanel: DialogueNode = {
  index: 661,
  text: [`This machine is still not online. Perhaps it'll be active soon?`],
  action: {
    type: 'trading',
    label: 'Trade',
  },
};

export default [tradingPanel];
