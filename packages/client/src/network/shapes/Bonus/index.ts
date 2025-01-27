export { getBonusValue, getBonusesByParent } from './getters';
export { parseBonusText } from './interpretation';
export {
  queryForEndType as queryBonusForEndType,
  queryForParent as queryBonusForParent,
  queryForType as queryBonusForType,
} from './queries';
export {
  genEndAnchor as genBonusEndAnchor,
  genTypeID as genBonusTypeID,
  getRegistry as getBonusRegistry,
} from './types';

export type { Bonus, BonusInstance } from './types';
