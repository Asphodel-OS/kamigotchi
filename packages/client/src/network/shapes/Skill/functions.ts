import { World } from '@mud-classic/recs';

import { Components } from 'network/';
import { Account } from '../Account';
import { getConfigFieldValueArray } from '../Config';
import { Kami, isDead, isHarvesting, isOffWorld, isStarving } from '../Kami';
import { checkCondition, getData } from '../utils';
import { Effect, Requirement, Skill } from './types';

export const getInstance = (target: Account | Kami, rSkill: Skill) => {
  const kSkill = target.skills?.find((s) => s.index === rSkill.index);
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
  const kSkill = kami.skills?.find((s) => s.index === rSkill.index);
  if ((kSkill?.points.current ?? 0) >= maxPoints) return [`Maxed Out [${maxPoints}/${maxPoints}]`];

  // status/roomIndex check
  if (isDead(kami)) return [`${kami.name} is Dead`];
  if (isOffWorld(kami)) return [`${kami.name} is Off World`];
  if (isStarving(kami)) return [`${kami.name} is busy Starving`];
  if (isHarvesting(kami)) return [`${kami.name} is busy Harvesting`];

  // tree check
  if (rSkill.treeTier > 0) {
    const tree = rSkill.tree;
    const invested = getData(world, components, kami.id, rSkill.tree + 'SKILL_POINTS_USE');
    const reqPts = getTreePointsRequirement(world, components, rSkill);
    if (invested < reqPts) return [`Not enough ${tree} points invested [${invested}/${reqPts}]`];
  }

  // requirements check
  for (let req of rSkill.requirements ?? []) {
    if (!checkCondition(world, components, req, kami).completable)
      return [`Unmet Requirement:`, `- ${parseRequirementText(req, registry)}`];
  }

  // skill cost
  if (rSkill.cost > kami.skillPoints)
    return [`Insufficient Skill Points.`, `Need ${rSkill.cost}. Have ${kami.skillPoints}.`];
};

export const getTreePoints = (world: World, components: Components, kami: Kami, tree: string) => {
  const treePoints = getData(world, components, kami.id, tree + 'SKILL_POINTS_USE');
  return treePoints ? treePoints : 0;
};

// parse the description of a skill effect from its components
// +10% Harvest Output Per Level
// [+]         [10 | 1.0]           [s | %]   [Harvest] [Output]  [Per Level]
// [logictype] [value/type/subtype] [subtype] [type]    [subtype] [constant]
export const parseEffectText = (effect: Effect): string => {
  let text = '';

  // number formatting
  if (effect.type === 'STAT') text += effect.value * 1;
  else if (effect.subtype === 'COOLDOWN') text += `${effect.value * 1}s`;
  else text += `${(effect.value / 10).toFixed(1)}%`; // default %

  // type
  if (effect.type !== 'STAT') text += ` ${effect.type.toLowerCase()}`;

  // subtype
  if (effect.subtype.endsWith('OFFENSE'))
    text += ` offensive ${effect.subtype.slice(0, -7).toLowerCase().replaceAll('_', ' ')}`;
  else if (effect.subtype.endsWith('DEFENSE'))
    text += ` defensive ${effect.subtype.slice(0, -7).toLowerCase().replaceAll('_', ' ')}`;
  else text += ` ${effect.subtype.toLowerCase().replaceAll('_', ' ')}`;

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
export const isMaxxed = (skill: Skill, holder: Account | Kami) => {
  const target = skill.points.max;
  const current = holder.skills?.find((n) => n.index === skill.index)?.points.current || 0;
  return current < target;
};

// check whether a holder has enough skill points to meet the cost of a skill
export const meetsCost = (skill: Skill, holder: Account | Kami): boolean => {
  return holder.skillPoints >= skill.cost;
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
