import { DialogueNode } from '.';

export const bellshapeddevice: DialogueNode = {
  index: 121,
  text: [
    'This machine was built to remove Kamigotchi from this reality and allow their digital souls to roam the blockchain freely.',
    'Do you want to access the portal?',
  ],
  action: {
    type: 'erc721Bridge',
    label: 'Perhaps',
  },
};

export default [bellshapeddevice];
