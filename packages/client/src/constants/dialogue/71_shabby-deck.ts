import { DialogueNode } from '.';

const bones: DialogueNode = {
  index: 711,
  text: ['They appear to be human bones.'],
};

const brokenwindow: DialogueNode = {
  index: 712,
  text: [
    'Someone used a grappling hook to climb up through this broken window.',
    'The synthetic rope is in poor enough condition that this must have happened decades ago.',
    'Lucky you and the Kami don’t need rope to get up there.',
  ],
};

const albinocentipede: DialogueNode = {
  index: 713,
  text: [
    'An albino cave centipede looking for a place to hide.',
    'It doesn’t seem to want to be around you.',
  ],
};

export default [bones, brokenwindow, albinocentipede];
