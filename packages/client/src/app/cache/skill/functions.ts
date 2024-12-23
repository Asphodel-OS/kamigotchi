import { EntityID, World } from '@mud-classic/recs';

import { isDead, isHarvesting, isOffWorld, isStarving } from 'app/cache/kami';
import { Components } from 'network/';
import { getBonusValue } from 'network/shapes/Bonus';
import { checkCondition, Condition } from 'network/shapes/Conditional';
import { Kami } from 'network/shapes/Kami';
import { Skill } from 'network/shapes/Skill/types';
import { getConfigArray } from '../config';

export const getInstance = (holder: Kami, index: number) => {
  const investments = holder.skills?.investments ?? [];
  const kSkill = investments.find((s) => s.index === index);
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
  const maxPoints = rSkill.max;
  const kSkill = kami.skills?.investments.find((s) => s.index === rSkill.index);
  if ((kSkill?.points ?? 0) >= maxPoints) return [`Maxed Out [${maxPoints}/${maxPoints}]`];

  // status/roomIndex check
  if (isDead(kami)) return [`${kami.name} is Dead`];
  if (isOffWorld(kami)) return [`${kami.name} is Off World`];
  if (isStarving(kami)) return [`${kami.name} is busy Starving`];
  if (isHarvesting(kami)) return [`${kami.name} is busy Harvesting`];

  // tree check
  if (rSkill.tier > 0) {
    const tree = rSkill.type;
    const invested = getHolderTreePoints(world, components, tree, kami.id);
    const reqPts = getTreePointsRequirement(world, components, rSkill);
    if (invested < reqPts) return [`Not enough ${tree} points invested [${invested}/${reqPts}]`];
  }

  // requirements check
  for (let req of rSkill.requirements ?? []) {
    if (!checkCondition(world, components, req, kami).completable)
      return [`Unmet tier:`, `- ${parseRequirementText(req, registry)}`];
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

// parse the description of a skill requirement from its components
export const parseRequirementText = (
  requirement: Condition,
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
  const max = skill.max;
  const investments = holder.skills?.investments ?? [];
  const investment = investments.find((n) => n.index === skill.index);
  const current = investment?.points ?? 0;
  return current >= max;
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
  const config = getConfigArray(world, components, 'KAMI_TREE_REQ');
  return config[skill.tier];
};
