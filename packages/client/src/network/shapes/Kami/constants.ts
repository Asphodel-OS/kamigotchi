import { EntityID, EntityIndex } from '@mud-classic/recs';

import { KAMI_BASE_URI } from 'constants/media';
import { Kami } from './types';

export const NullKami: Kami = {
  ObjectType: 'KAMI',
  entity: 0 as EntityIndex,
  id: '0' as EntityID,
  index: 0,
  image: `${KAMI_BASE_URI}blank.gif`,
  name: 'NullKami',
  state: '',
};
