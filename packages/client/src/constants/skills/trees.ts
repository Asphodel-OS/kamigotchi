
const healthTree = [
  [1],
  [5, 110],
];

const powerTree = [
  [2],
  [6, 201, 210],
  [202, 220],
  [203],
  [204],
];

const viloenceTree = [
  [3],
  [7, 320],
];

const harmonyTree = [
  [4],
  [8, 401],
];

export const SkillTrees = new Map([
  ['health', healthTree],
  ['power', powerTree],
  ['viloence', viloenceTree],
  ['harmony', harmonyTree],
]);