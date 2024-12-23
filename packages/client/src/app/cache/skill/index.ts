export { get as getSkill, process as processSkill } from './base';
export {
  getHolderTreePoints as getHolderSkillTreePoints,
  getInstance as getSkillInstance,
  getTreePointsRequirement as getSkillTreePointsRequirement,
  getUpgradeError as getSkillUpgradeError,
} from './functions';

export type { Skill } from 'network/shapes/Skill';
