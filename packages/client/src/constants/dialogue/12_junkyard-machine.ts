import { DialogueNode } from '.';

export const bellshapeddevice: DialogueNode = {
  index: 121,
  text: [
    'This machine was built to remove Kamigotchi from this reality and allow their digital souls to roam the blockchain freely.',
    'Do you want to bridge out your Kamigotchi?',
  ],
  action: {
    type: 'erc721Bridge',
    label: 'Bridge',
  },
};

export default [bellshapeddevice];
