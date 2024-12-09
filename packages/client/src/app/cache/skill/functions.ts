import { EntityID, World } from '@mud-classic/recs';

import { isDead, isHarvesting, isOffWorld, isStarving } from 'app/cache/kami';
import { Components } from 'network/';
import { Bonus, getBonusValue } from 'network/shapes/Bonus';
import { checkCondition } from 'network/shapes/Conditional';
import { getConfigFieldValueArray } from 'network/shapes/Config';
import { Kami } from 'network/shapes/Kami';
import { Requirement, Skill } from 'network/shapes/Skill/types';

export const getInstance = (target: Kami, rSkill: Skill) => {
  const kSkill = target.skills?.tree.find((s) => s.index === rSkill.index);
  return kSkill;
};

// get the reason why a player cannot upgrade a skill
// checking (in order) roomIndex/status, maxxed out, requirements unmet, not enough points
// NOTE: assumes Account, Skills and Harvest are attached to the input Kami
export const getUpgradeError = (
  world: World,
  components: Components,
  index: number,
  kami: Kami,
  registry: Map<number, Skill>
) => {
  // registry check
  const rSkill = registry.get(index);
  if (!rSkill) return ['Skill not found'];

  // maxed out check
  const maxPoints = rSkill.points.max;
  const kSkill = kami.skills?.tree.find((s) => s.index === rSkill.index);
  if ((kSkill?.points.current ?? 0) >= maxPoints) return [`Maxed Out [${maxPoints}/${maxPoints}]`];

  // status/roomIndex check
  if (isDead(kami)) return [`${kami.name} is Dead`];
  if (isOffWorld(kami)) return [`${kami.name} is Off World`];
  if (isStarving(kami)) return [`${kami.name} is busy Starving`];
  if (isHarvesting(kami)) return [`${kami.name} is busy Harvesting`];

  // tree check
  if (rSkill.treeTier > 0) {
    const tree = rSkill.tree;
    const invested = getHolderTreePoints(world, components, tree, kami.id);
    const reqPts = getTreePointsRequirement(world, components, rSkill);
    if (invested < reqPts) return [`Not enough ${tree} points invested [${invested}/${reqPts}]`];
  }

  // requirements check
  for (let req of rSkill.requirements ?? []) {
    if (!checkCondition(world, components, req, kami).completable)
      return [`Unmet Requirement:`, `- ${parseRequirementText(req, registry)}`];
  }

  // skill cost
  const numPoints = kami.skills?.points ?? 0;
  if (rSkill.cost > numPoints)
    return [`Insufficient Skill Points.`, `Need ${rSkill.cost}. Have ${numPoints}.`];
};

export const getHolderTreePoints = (
  world: World,
  components: Components,
  tree: string,
  holderID: EntityID
) => {
  const treePoints = getBonusValue(world, components, 'SKILL_TREE_' + tree, holderID);
  return treePoints ? treePoints : 0;
};

// parse the description of a skill bonus from its components
// +10% Harvest Output Per Level
// [+]         [10 | 1.0]           [s | %]   [Harvest] [Output]  [Per Level]
// [logictype] [value/type/subtype] [subtype] [type]    [subtype] [constant]
export const parseBonusText = (bonus: Bonus): string => {
  let text = '';

  // number formatting
  if (bonus.type.includes('STAT')) text += bonus.value * 1;
  else if (bonus.type.startsWith('COOLDOWN')) text += `${bonus.value * 1}s`;
  else text += `${(bonus.value / 10).toFixed(1)}%`; // default %

  // type
  if (bonus.type.startsWith('STAT')) text += ` ${bonus.type.split('_')[1]}`;
  else if (bonus.type.endsWith('OFFENSE')) text += ` offensive ${bonus.type.slice(0, -7)}`;
  else if (bonus.type.endsWith('DEFENSE')) text += ` defensive ${bonus.type.slice(0, -7)}`;
  else text += ` ${bonus.type}`;

  // formatting
  text = text.toLowerCase().replaceAll('_', ' ');

  // replace contractions with full words
  text = text.replaceAll('atk', 'attack ');
  text = text.replaceAll('def', 'defense ');
  text = text.replaceAll('harv', 'harvest ');
  text = text.replaceAll('stnd', 'standard');

  return text + ' per level';
};

// parse the description of a skill requirement from its components
export const parseRequirementText = (
  requirement: Requirement,
  registry: Map<number, Skill>
): string => {
  const index = (requirement.target.index ?? 0) * 1;
  const value = (requirement.target.value ?? 0) * 1;
  const type = requirement.target.type;

  if (type === 'LEVEL') {
    return `Kami Lvl${value}`;
  } else if (type === 'SKILL') {
    const name = registry.get(index!)?.name;
    if (value == 0) return `Cannot have [${name}]`;
    return `Lvl${value} [${name}]`;
  } else {
    return ' ???';
  }
};

///////////////////////
// CHECKS

// check whether a skill is maxxed out
export const isMaxxed = (skill: Skill, holder: Kami) => {
  const target = skill.points.max;
  const current = holder.skills?.tree.find((n) => n.index === skill.index)?.points.current || 0;
  return current < target;
};

// check whether a holder has enough skill points to meet the cost of a skill
export const meetsCost = (skill: Skill, holder: Kami): boolean => {
  const numPoints = holder.skills?.points ?? 0;
  return numPoints >= skill.cost;
};

///////////////////////
// UTILS

// gets the tree-points investment requirement for a skill
export const getTreePointsRequirement = (
  world: World,
  components: Components,
  skill: Skill
): number => {
  const config = getConfigFieldValueArray(world, components, 'KAMI_TREE_REQ');
  return config[skill.treeTier];
};
