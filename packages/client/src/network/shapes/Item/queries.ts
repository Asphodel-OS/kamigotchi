import { EntityIndex, World } from '@mud-classic/recs';

import { getEntityByHash } from '../utils';

export const queryByIndex = (world: World, index: number): EntityIndex | undefined => {
  return getEntityByHash(world, ['registry.item', index], ['string', 'uint32']);
};
