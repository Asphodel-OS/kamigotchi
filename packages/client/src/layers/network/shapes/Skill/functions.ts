import { Effect, Requirement, Skill } from "./types";
import { Account } from "../Account";
import { Kami } from "../Kami";


// get the reason why a player cannot upgrade a skill
// checking (in order) location/status, maxxed out, requirements unmet, not enough points
// TODO: actually check for location instead of being lazy
export const getUpgradeError = (index: number, kami: Kami, registry: Skill[]) => {
  // status/location check
  if (kami.state !== 'RESTING') return [`${kami.name} must be Resting`];

  // registry check
  const rSkill = registry.find((s) => s.index * 1 === index);
  if (!rSkill) return ['Skill not found'];

  // maxxed out check
  const maxPoints = rSkill.points.max;
  const kSkill = kami.skills?.find((s) => s.index === rSkill.index);
  if ((kSkill?.points.current ?? 0) >= maxPoints) return [`Maxxed Out (${maxPoints}/${maxPoints})`];

  // requirements check
  for (let req of rSkill.requirements ?? []) {
    if (!meetsRequirement(req, kami)) return [
      `Unmet Requirement:`,
      `${parseRequirementText(req, registry)}`,
    ];
  }

  // skill cost
  if (rSkill.cost > kami.skillPoints) return [
    `Insufficient Skill Points.`,
    `Need ${rSkill.cost}. Have ${kami.skillPoints}.`
  ];
}

// parse the description of a skill requirement from its components
export const parseRequirementText = (requirement: Requirement, registry: Skill[]): string => {
  switch (requirement.type) {
    case 'LEVEL':
      return `Kami Lvl${requirement.value}`;
    case 'SKILL':
      const skillName = registry.find((entry) => entry.index === requirement.index)?.name;
      return `${skillName} Lvl${(requirement.value ?? 0) * 1}`;
    default:
      return ' ???';
  }
}

// parse the description of a skill effect from its components
// +10% Harvest Output Per Level
// [+]         [10 | 1.0]           [s | %]   [Harvest] [Output]  [Per Level]
// [logictype] [value/type/subtype] [subtype] [type]    [subtype] [constant]
export const parseEffectText = (effect: Effect): string => {
  let text = '';

  // positive or negative
  if (effect.logicType === 'INC') text += '+';
  else if (effect.logicType === 'DEC') text += '-';

  // number formatting
  if (effect.type === 'STAT') text += effect.value * 1;
  else if (effect.subtype === 'DRAIN') text += `${(effect.value / 10).toFixed(1)}%`;
  else if (effect.subtype === 'OUTPUT') text += `${(effect.value / 10).toFixed(1)}%`;
  else if (effect.subtype === 'COOLDOWN') text += `${effect.value * 1}s`;
  else text += effect.value * 1;

  // type
  if (effect.type !== 'STAT') text += ` ${effect.type.toLowerCase()}`;

  // subtype
  text += ` ${effect.subtype.toLowerCase()}`;

  return text + ' per level';
}


///////////////////////
// CHECKS

// check whether a skill is maxxed out
export const isMaxxed = (skill: Skill, holder: Account | Kami) => {
  const target = skill.points.max;
  const current = holder.skills?.find((n) => n.index === skill.index)?.points.current || 0;
  return current < target;
}

// check whether a holder has enough skill points to meet the cost of a skill
export const meetsCost = (skill: Skill, holder: Account | Kami): boolean => {
  return holder.skillPoints >= skill.cost;
}

// check whether a holder meets a requirement of a skill
export const meetsRequirement = (requirement: Requirement, holder: Account | Kami) => {
  let target, current, skill;
  switch (requirement.type) {
    case 'LEVEL':
      target = requirement.value ?? 0;
      current = holder.level;
      return current >= target;
    case 'SKILL':
      target = requirement.value ?? 0;
      skill = holder.skills?.find((s) => s.index === requirement.index);
      current = skill?.points.current || 0;
      return current >= target;
    default:
      console.warn('Unknown requirement type', requirement.type);
      return false;
  }
}

// check whether a holder meets the required level of a skill
const meetsRequiredLevel = (requirement: Requirement, holder: Account | Kami) => {
  const target = requirement.value as number || 0;
  const current = holder.level;
  return current >= target;
}

// check whether a holder meets the required skill level of a skill
const meetsRequiredSkill = (requirement: Requirement, holder: Account | Kami) => {
  const target = requirement.value as number || 0;
  const current = holder.skills?.find((n) => n.index === requirement.index)?.points.current || 0;
  return current >= target;
}
