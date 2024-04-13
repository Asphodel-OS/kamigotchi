const predatorTree = [
  [111, 112, 113],
  [121, 122, 123],
  [131, 132, 133],
  [141, 142, 143],
  [151, 152, 153],
];

const enlightenedTree = [
  [211, 212, 213],
  [221, 222, 223],
  [231, 232, 233],
  [241, 242, 243],
  [251, 252, 253],
];

const guardianTree = [
  [311, 312, 313],
  [321, 322, 323],
  [331, 332, 333],
  [341, 342, 343],
  [351, 352, 353],
];

const harvesterTree = [
  [411, 412, 413],
  [421, 422, 423],
  [431, 432, 433],
  [441, 442, 443],
  [451, 452, 453],
];

export const SkillTrees = new Map([
  ['predator', predatorTree],
  ['enlightened', enlightenedTree],
  ['guardian', guardianTree],
  ['harvester', harvesterTree],
]);
