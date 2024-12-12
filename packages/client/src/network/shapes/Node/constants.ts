import { EntityID, EntityIndex } from '@mud-classic/recs';

import { Node } from './types';

export const NullNode: Node = {
  ObjectType: 'NODE',
  id: '0' as EntityID,
  index: 0,
  entity: 0 as EntityIndex,
  type: '' as string,
  image: '',
  roomIndex: 0,
  name: 'Empty Node',
  description: 'There is no node in this room.',
  affinity: '' as string,
  drops: [],
  requirements: [],
};
