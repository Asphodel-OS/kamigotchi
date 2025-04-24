import { EntityID, EntityIndex } from '@mud-classic/recs';
import { Room } from './types';

export const NullRoom: Room = {
  index: 0,
  entity: 0 as EntityIndex,
  id: '' as EntityID,
  name: '',
  description: '',
  exits: [],
  gates: [],
  location: { x: 0, y: 0, z: 0 },
};
