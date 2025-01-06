export {
  getInstance as getBonusInstance,
  getRegistry as getBonusRegistry,
  process as processBonus,
} from './base';
export { getForEndType as getBonusesForEndType } from './getters';

export type { Bonus, BonusInstance } from 'network/shapes/Bonus';
