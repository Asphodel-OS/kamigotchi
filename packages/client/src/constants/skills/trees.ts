const PredatorTree = [
  [111, 112, 113],
  [121, 122, 123],
  [131, 132, 133],
  [141, 142, 143],
  [151, 152, 153],
  [161, 162, 163],
];

const EnlightenedTree = [
  [211, 212, 213],
  [221, 222, 223],
  [231, 232, 233],
  [241, 242, 243],
  [251, 252, 253],
  [261, 262, 263],
];

const GuardianTree = [
  [311, 312, 313],
  [321, 322, 323],
  [331, 332, 333],
  [341, 342, 343],
  [351, 352, 353],
  [361, 362, 363],
];

const HarvesterTree = [
  [411, 412, 413],
  [421, 422, 423],
  [431, 432, 433],
  [441, 442, 443],
  [451, 452, 453],
  [461, 462, 463],
];

export const SkillTrees = new Map([
  ['Predator', PredatorTree],
  ['Enlightened', EnlightenedTree],
  ['Guardian', GuardianTree],
  ['Harvester', HarvesterTree],
]);

export const TreeColors = {
  predator: '#BD4F6C',
  enlightened: '#D7BCE8',
  guardian: '#9CBCD2',
  harvester: '#F9DB6D',
};
