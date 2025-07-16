export {
  getInstance as getBonusInstance,
  getRegistry as getBonusRegistry,
  process as processBonus,
} from './base';
export { getByItems as getBonusesByItems, getForEndType as getBonusesForEndType } from './getters';

export type { Bonus, BonusInstance } from 'network/shapes/Bonus';
