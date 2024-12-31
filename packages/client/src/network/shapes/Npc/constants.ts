import { EntityID, EntityIndex } from '@mud-classic/recs';

import { NPC } from './types';

export const NullNPC: NPC = {
  id: '0' as EntityID,
  index: 0,
  entity: 0 as EntityIndex,
  name: '',
  roomIndex: 0,
};
