import { EntityID, EntityIndex } from '@mud-classic/recs';
import { Item } from './types';

export const NullItem: Item = {
  ObjectType: 'ITEM',
  id: '0' as EntityID,
  entity: 0 as EntityIndex,
  index: 0,
  type: '',
  for: '',
  image: '',
  name: 'None',
  requirements: { use: [] },
  effects: { use: [] },
  is: {
    tradeable: false,
  },
};
