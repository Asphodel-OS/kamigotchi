const predatorTree = [
  [111, 112, 113],
  [121, 122, 123],
  [131, 133, 132],
  [141, 142, 143],
  [151, 152, 153],
];

const enlightenedTree = [
  [211, 212, 213],
  [221, 222, 223],
  [231, 233, 232],
  [241, 242, 243],
  [251, 252, 253],
];

const guardianTree = [
  [311, 312, 313],
  [321, 322, 323],
  [331, 333, 332],
  [341, 342, 343],
  [351, 352, 353],
];

const harvesterTree = [
  [411, 412, 413],
  [421, 422, 423],
  [431, 433, 432],
  [441, 442, 443],
  [451, 452, 453],
];

// hardcoded mutually exclusive skill tree; each tree is the same format
// x31-x33 are mutually exclusive
// x51-x52-x53 are mutually exclusive
// elements represent the space between skills (horizontal)
export const MutualExclusivity = [
  [false, false],
  [false, false],
  [true, false],
  [false, false],
  [true, true],
];

export const SkillTrees = new Map([
  ['predator', predatorTree],
  ['enlightened', enlightenedTree],
  ['guardian', guardianTree],
  ['harvester', harvesterTree],
]);
