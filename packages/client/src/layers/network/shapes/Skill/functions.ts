
import { Requirement, Skill, Status } from "./types";
import { Account } from "../Account";
import { Kami } from "../Kami";


///////////////////////
// CHECKS

// check whether a skill is maxxed out
export const isMaxxed = (skill: Skill, holder: Account | Kami): Status => {
  const target = skill.max;
  const current = holder.skills?.find((n) => n.index === skill.index)?.level || 0;
  return {
    target: target,
    current: current,
    completable: current < target
  };
}

// check whether a holder has enough skill points to meet the cost of a skill
export const meetsCost = (skill: Skill, holder: Account | Kami): boolean => {
  return holder.skillPoints >= skill.cost;
}

// check whether a holder meets a requirement of a skill
export const meetsRequirement = (requirement: Requirement, holder: Account | Kami): Status => {
  switch (requirement.type) {
    case 'LEVEL':
      return meetsRequiredLevel(requirement, holder);
    case 'SKILL':
      return meetsRequiredSkill(requirement, holder);
    default:
      return { completable: false }; // should not get here
  }
}

// check whether a holder meets the required level of a skill
const meetsRequiredLevel = (condition: Requirement, holder: Account | Kami): Status => {
  const target = Number(condition.value as number || 0);
  const current = Number(holder.level);
  return {
    target: target,
    current: current,
    completable: current >= target,
  };
}

// check whether a holder meets the required skill level of a skill
const meetsRequiredSkill = (condition: Requirement, holder: Account | Kami): Status => {
  const target = Number(condition.value as number || 0);
  const current = Number(holder.skills?.find((n) => n.index === condition.index)?.level || 0);
  return {
    target: target,
    current: current,
    completable: current >= target,
  }
}
