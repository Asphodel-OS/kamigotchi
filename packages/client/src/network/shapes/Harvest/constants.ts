import { EntityID, EntityIndex } from '@mud-classic/recs';
import { NullNode } from '../Node';
import { Harvest } from './types';

export const NullHarvest: Harvest = {
  id: '0' as EntityID,
  entityIndex: 0 as EntityIndex,
  balance: 0,
  rate: 0,
  state: '',
  time: {
    last: 0,
    reset: 0,
    start: 0,
  },
  node: NullNode,
};
