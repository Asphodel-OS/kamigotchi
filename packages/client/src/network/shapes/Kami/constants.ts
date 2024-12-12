import { EntityID, EntityIndex } from '@mud-classic/recs';
import { Kami } from './types';

export const NullKami: Kami = {
  ObjectType: 'KAMI',
  entity: 0 as EntityIndex,
  id: '0' as EntityID,
  index: 0,
  image: '',
  name: 'NullKami',
  state: '',
};
