import { EntityID, EntityIndex } from 'engine/recs';
import { ScavBar } from './types';

export const NullScavenge: ScavBar = {
  id: '0' as EntityID,
  entity: 0 as EntityIndex,
  index: 0,
  type: '',
  affinity: '',
  cost: 100,
  rewards: [],
};
